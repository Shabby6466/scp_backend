import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { DocumentType } from '../../entities/document.entity';
import { UserRole, RenewalPeriod } from '../common/enums/database.enum';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';
import { MailerService } from '../mailer/mailer.service';
import { UserService } from '../user/user.service';
import { ComplianceCategoryService } from '../compliance-category/compliance-category.service';
import { BranchService } from '../branch/branch.service';

type CurrentUser = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

@Injectable()
export class DocumentTypeService {
  constructor(
    @InjectRepository(DocumentType)
    private readonly documentTypeRepository: Repository<DocumentType>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => ComplianceCategoryService))
    private readonly categoryService: ComplianceCategoryService,
    @Inject(forwardRef(() => BranchService))
    private readonly branchService: BranchService,
    private readonly mailer: MailerService,
  ) { }

  private canAssignRole(actorRole: UserRole, targetRole: UserRole): boolean {
    if (targetRole === UserRole.ADMIN || targetRole === UserRole.DIRECTOR) {
      return false;
    }
    if (actorRole === UserRole.ADMIN) {
      return true;
    }
    if (actorRole === UserRole.DIRECTOR) {
      return (
        targetRole === UserRole.BRANCH_DIRECTOR ||
        targetRole === UserRole.TEACHER
      );
    }
    if (actorRole === UserRole.BRANCH_DIRECTOR) {
      return targetRole === UserRole.TEACHER;
    }
    return false;
  }

  private assertActorCanAccessDocType(
    actor: CurrentUser,
    docType: { schoolId: string | null; branchId: string | null },
  ) {
    if (actor.role === UserRole.ADMIN) {
      return;
    }
    if (!actor.schoolId) {
      throw new ForbiddenException('Your account is not linked to a school');
    }
    if (docType.schoolId && docType.schoolId !== actor.schoolId) {
      throw new ForbiddenException('Document type is outside your school');
    }
    if (actor.role === UserRole.DIRECTOR) {
      return;
    }
    if (actor.role === UserRole.BRANCH_DIRECTOR) {
      if (!actor.branchId) {
        throw new ForbiddenException('Your account is not linked to a branch');
      }
      if (!docType.branchId) {
        return;
      }
      if (docType.branchId !== actor.branchId) {
        throw new ForbiddenException('Document type is outside your branch');
      }
      return;
    }
    if (
      actor.role === UserRole.TEACHER ||
      actor.role === UserRole.PARENT
    ) {
      if (docType.schoolId !== actor.schoolId) {
        throw new ForbiddenException('Document type is outside your school');
      }
      if (!docType.branchId) {
        return;
      }
      if (actor.branchId && docType.branchId === actor.branchId) {
        return;
      }
      if (!actor.branchId) {
        throw new ForbiddenException('Document type is scoped to a branch');
      }
      if (docType.branchId !== actor.branchId) {
        throw new ForbiddenException('Document type is outside your branch');
      }
      return;
    }
    throw new ForbiddenException('Cannot access this document type');
  }

  private ensureScope(
    actor: CurrentUser,
    target: { schoolId: string | null; branchId: string | null },
  ) {
    if (actor.role === UserRole.ADMIN) return;
    if (!actor.schoolId) {
      throw new ForbiddenException('Your account is not linked to a school');
    }
    if (target.schoolId !== actor.schoolId) {
      throw new ForbiddenException('Target user is outside your school scope');
    }
    if (
      actor.role === UserRole.BRANCH_DIRECTOR &&
      actor.branchId !== target.branchId
    ) {
      throw new ForbiddenException('Target user is outside your branch scope');
    }
  }

  async create(dto: CreateDocumentTypeDto, user: CurrentUser) {
    if (!this.canAssignRole(user.role, dto.targetRole as UserRole)) {
      throw new ForbiddenException('You cannot create doc types for this role');
    }

    let schoolId: string | null = null;
    let branchId: string | null = null;

    if (user.role === UserRole.ADMIN) {
      schoolId = dto.schoolId ?? null;
      branchId = dto.branchId ?? null;
      if (branchId) {
        if (!schoolId) {
          throw new BadRequestException('schoolId is required when branchId is set');
        }
        const b = await this.branchService.findOneById(branchId);
        if (!b || b.schoolId !== schoolId) {
          throw new BadRequestException('Branch does not belong to the selected school');
        }
      }
    } else if (user.role === UserRole.DIRECTOR) {
      schoolId = user.schoolId ?? null;
      branchId = null;
      if (!schoolId) {
        throw new ForbiddenException('Your account is not linked to a school');
      }
      if (dto.schoolId && dto.schoolId !== schoolId) {
        throw new ForbiddenException('Cannot create document type outside your school');
      }
      if (dto.branchId) {
        throw new ForbiddenException('Directors create school-wide document types only');
      }
    } else if (user.role === UserRole.BRANCH_DIRECTOR) {
      schoolId = user.schoolId!;
      branchId = user.branchId!;
      if (!schoolId || !branchId) {
        throw new ForbiddenException('Your account must be linked to a school and branch');
      }
    } else {
      throw new ForbiddenException('Cannot create document types');
    }

    if (dto.complianceCategoryId) {
      const cat = await this.categoryService.findOneInternal(dto.complianceCategoryId);
      if (!cat) {
        throw new BadRequestException('Compliance category not found');
      }
      if (cat.schoolId !== schoolId) {
        throw new BadRequestException(
          'Compliance category does not belong to the same school',
        );
      }
    }

    const docType = this.documentTypeRepository.create({
      name: dto.name.trim(),
      targetRole: dto.targetRole as UserRole,
      renewalPeriod: (dto.renewalPeriod as RenewalPeriod) ?? RenewalPeriod.NONE,
      schoolId,
      branchId,
      categoryId: dto.complianceCategoryId || null,
      createdById: user.id,
    });

    return this.documentTypeRepository.save(docType);
  }

  async update(id: string, dto: UpdateDocumentTypeDto, user: CurrentUser) {
    const existing = await this.documentTypeRepository.findOne({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Document type not found');
    }
    this.assertActorCanAccessDocType(user, existing);

    if (dto.targetRole !== undefined) {
      if (!this.canAssignRole(user.role, dto.targetRole as UserRole)) {
        throw new ForbiddenException('You cannot set this target role');
      }
      existing.targetRole = dto.targetRole as UserRole;
    }

    if (dto.complianceCategoryId !== undefined && dto.complianceCategoryId !== null) {
      const cat = await this.categoryService.findOneInternal(dto.complianceCategoryId);
      if (!cat) throw new BadRequestException('Compliance category not found');
      if (existing.schoolId && cat.schoolId !== existing.schoolId) {
        throw new BadRequestException(
          'Compliance category does not belong to the same school',
        );
      }
      existing.categoryId = dto.complianceCategoryId;
    } else if (dto.complianceCategoryId === null) {
      existing.categoryId = null;
    }

    if (dto.name !== undefined) existing.name = dto.name.trim();
    if (dto.renewalPeriod !== undefined) existing.renewalPeriod = dto.renewalPeriod as RenewalPeriod;
    if (dto.isMandatory !== undefined) existing.isMandatory = dto.isMandatory;

    return this.documentTypeRepository.save(existing);
  }

  async assignUsers(
    documentTypeId: string,
    userIds: string[],
    user: CurrentUser,
  ) {
    const docType = await this.documentTypeRepository.findOne({
      where: { id: documentTypeId },
      relations: ['requiredUsers'],
    });
    if (!docType) throw new NotFoundException('Document type not found');

    this.assertActorCanAccessDocType(user, docType);

    const targets = await this.userService.findUsersByIds(userIds);

    if (targets.length !== userIds.length) {
      throw new BadRequestException('Some users were not found');
    }

    for (const target of targets) {
      if (!this.canAssignRole(user.role, target.role)) {
        throw new ForbiddenException(
          `Cannot assign documents to role ${target.role}`,
        );
      }
      this.ensureScope(user, target);
      if (docType.targetRole && target.role !== docType.targetRole) {
        throw new BadRequestException(
          'Target user role does not match document type target role',
        );
      }
      if (docType.branchId && target.branchId !== docType.branchId) {
        throw new BadRequestException(
          'This document type is limited to a specific branch; pick users from that branch.',
        );
      }
    }

    // Append only new ones
    const existingIds = new Set(docType.requiredUsers?.map(u => u.id) || []);
    const toAdd = targets.filter(t => !existingIds.has(t.id));

    if (toAdd.length > 0) {
      docType.requiredUsers = [...(docType.requiredUsers || []), ...toAdd];
      await this.documentTypeRepository.save(docType);

      await Promise.allSettled(
        toAdd.map((target) =>
          target.email
            ? this.mailer.sendDocTypeAssigned(target.email, docType.name)
            : Promise.resolve(),
        ),
      );
    }

    return this.getAssignees(documentTypeId, user);
  }

  async unassignUser(
    documentTypeId: string,
    userId: string,
    user: CurrentUser,
  ) {
    const docType = await this.documentTypeRepository.findOne({
      where: { id: documentTypeId },
      relations: ['requiredUsers'],
    });
    if (!docType) throw new NotFoundException('Document type not found');
    this.assertActorCanAccessDocType(user, docType);

    const target = await this.userService.findOneInternal(userId);
    if (!target) throw new NotFoundException('User not found');
    if (!this.canAssignRole(user.role, target.role)) {
      throw new ForbiddenException(
        `Cannot unassign documents from role ${target.role}`,
      );
    }
    this.ensureScope(user, target);

    if (docType.requiredUsers) {
      docType.requiredUsers = docType.requiredUsers.filter(u => u.id !== userId);
      await this.documentTypeRepository.save(docType);
    }

    return this.getAssignees(documentTypeId, user);
  }

  async getAssignedForCurrentUser(user: CurrentUser) {
    return this.userService.findRequiredDocTypesForUser(user.id);
  }

  async getAssignees(documentTypeId: string, user: CurrentUser) {
    const docType = await this.documentTypeRepository.findOne({
      where: { id: documentTypeId },
      relations: ['requiredUsers'],
    });
    if (!docType) throw new NotFoundException('Document type not found');

    this.assertActorCanAccessDocType(user, docType);

    let requiredUsers = docType.requiredUsers || [];
    if (user.role === UserRole.BRANCH_DIRECTOR && user.branchId) {
      requiredUsers = requiredUsers.filter((u) => u.branchId === user.branchId);
    }

    return { ...docType, requiredUsers };
  }

  async findAll(
    filters: {
      schoolId?: string;
      branchId?: string;
      targetRole?: UserRole;
    },
    user: CurrentUser,
  ) {
    const where: any = {};

    if (filters.targetRole) {
      where.targetRole = filters.targetRole;
    }

    if (user.role === UserRole.ADMIN) {
      if (filters.schoolId) {
        where.schoolId = filters.schoolId;
      }
      if (filters.branchId) {
        where.branchId = filters.branchId;
      }
    } else if (user.role === UserRole.DIRECTOR) {
      if (!user.schoolId) {
        throw new ForbiddenException('Your account is not linked to a school');
      }
      where.schoolId = user.schoolId;
    } else if (user.role === UserRole.BRANCH_DIRECTOR) {
      if (!user.schoolId || !user.branchId) {
        throw new ForbiddenException(
          'Your account must be linked to a school and branch',
        );
      }
      where.schoolId = user.schoolId;
      // Scoped find
      return this.documentTypeRepository.find({
        where: [
          { schoolId: user.schoolId, branchId: IsNull() },
          { schoolId: user.schoolId, branchId: user.branchId },
        ],
        order: { sortOrder: 'ASC', createdAt: 'DESC' },
        relations: ['category'],
      });
    } else if (
      user.role === UserRole.TEACHER ||
      user.role === UserRole.PARENT
    ) {
      if (!user.schoolId) {
        throw new ForbiddenException('Your account is not linked to a school');
      }
      const findOptions: any = {
        where: [
          { schoolId: user.schoolId, branchId: IsNull() },
        ],
        order: { sortOrder: 'ASC', createdAt: 'DESC' },
        relations: ['category']
      };
      if (user.branchId) {
        findOptions.where.push({ schoolId: user.schoolId, branchId: user.branchId });
      }
      return this.documentTypeRepository.find(findOptions);
    } else {
      throw new ForbiddenException('Cannot list document types');
    }

    return this.documentTypeRepository.find({
      where,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      relations: ['category'],
    });
  }

  async findOne(id: string, user: CurrentUser) {
    const docType = await this.documentTypeRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!docType) {
      throw new NotFoundException('Document type not found');
    }
    this.assertActorCanAccessDocType(user, docType);
    return docType;
  }

  async findMandatory() {
    return this.documentTypeRepository.find({
      where: { isMandatory: true },
      select: ['id', 'targetRole'],
    });
  }

  async findOneInternal(id: string) {
    return this.documentTypeRepository.findOne({ where: { id } });
  }
}
