import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ComplianceCategoryService } from './compliance-category.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/database.enum';
import { CreateComplianceCategoryDto } from './dto/create-compliance-category.dto';
import { UpdateComplianceCategoryDto } from './dto/update-compliance-category.dto';

@Controller('compliance-categories')
@UseGuards(JwtAuthGuard)
export class ComplianceCategoryController {
  constructor(
    private readonly complianceCategoryService: ComplianceCategoryService,
  ) { }

  @Post()
  create(
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
    @Body() dto: CreateComplianceCategoryDto,
  ) {
    return this.complianceCategoryService.create(dto, user);
  }

  @Get()
  findAll(
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
    @Query('schoolId') schoolId?: string,
  ) {
    return this.complianceCategoryService.findAll(user, schoolId);
  }

  @Get('by-slug/:slug')
  findBySlug(
    @Param('slug') slug: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.complianceCategoryService.findBySlug(slug, user);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.complianceCategoryService.findOne(id, user);
  }

  @Get(':id/score')
  getScore(
    @Param('id') id: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.complianceCategoryService.getScore(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateComplianceCategoryDto,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.complianceCategoryService.update(id, dto, user);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.complianceCategoryService.delete(id, user);
  }
}
