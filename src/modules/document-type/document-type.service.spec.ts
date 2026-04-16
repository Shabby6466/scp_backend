import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DocumentType } from '../../entities/document.entity';
import { RenewalPeriod, UserRole } from '../common/enums/database.enum';
import { DocumentTypeService } from './document-type.service';
import { UserService } from '../user/user.service';
import { ComplianceCategoryService } from '../compliance-category/compliance-category.service';
import { BranchService } from '../branch/branch.service';
import { MailerService } from '../mailer/mailer.service';

describe('DocumentTypeService', () => {
  let service: DocumentTypeService;
  const save = jest.fn((x) => Promise.resolve(x));
  const branchFindOneById = jest.fn();

  beforeEach(async () => {
    save.mockClear();
    branchFindOneById.mockReset();

    const moduleRef = await Test.createTestingModule({
      providers: [
        DocumentTypeService,
        {
          provide: getRepositoryToken(DocumentType),
          useValue: {
            create: jest.fn((x) => x),
            save,
            findOne: jest.fn(),
            find: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {},
        },
        {
          provide: ComplianceCategoryService,
          useValue: { findOneInternal: jest.fn() },
        },
        {
          provide: BranchService,
          useValue: { findOneById: branchFindOneById },
        },
        {
          provide: MailerService,
          useValue: {},
        },
      ],
    }).compile();

    service = moduleRef.get(DocumentTypeService);
  });

  describe('create (director + branchId)', () => {
    const director = {
      id: 'dir-1',
      role: UserRole.DIRECTOR,
      schoolId: 'school-1',
      branchId: null as string | null,
    };

    it('sets branchId when branch belongs to the director school', async () => {
      branchFindOneById.mockResolvedValue({ id: 'branch-1', schoolId: 'school-1' });

      await service.create(
        {
          name: ' Health Form ',
          targetRole: UserRole.STUDENT,
          branchId: 'branch-1',
        } as any,
        director,
      );

      expect(branchFindOneById).toHaveBeenCalledWith('branch-1');
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          branchId: 'branch-1',
          schoolId: 'school-1',
          targetRole: UserRole.STUDENT,
          renewalPeriod: RenewalPeriod.NONE,
        }),
      );
    });

    it('rejects branchId when branch is not in the director school', async () => {
      branchFindOneById.mockResolvedValue({ id: 'branch-x', schoolId: 'other-school' });

      await expect(
        service.create(
          {
            name: 'Form',
            targetRole: UserRole.STUDENT,
            branchId: 'branch-x',
          } as any,
          director,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
