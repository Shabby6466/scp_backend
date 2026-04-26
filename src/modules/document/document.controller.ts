import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PresignDto } from './dto/presign.dto';
import { CompleteDocumentDto } from './dto/complete.dto';
import { SearchDocumentDto } from './dto/search-document.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/database.enum';
import type { Response } from 'express';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) { }

  @Get('search')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.DIRECTOR,
    UserRole.BRANCH_DIRECTOR,
  )
  searchDocuments(
    @Query() dto: SearchDocumentDto,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.searchDocuments(dto, user);
  }

  @Post('presign')
  presign(
    @Body() dto: PresignDto,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.presign(dto, user);
  }

  @Post('complete')
  complete(
    @Body() dto: CompleteDocumentDto,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.complete(dto, user);
  }

  /** Alias: documents for a user (teacher, student, etc.) by user id. */
  @Get('staff/:staffId')
  listByStaff(
    @Param('staffId') staffId: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.listByOwner(staffId, user);
  }

  @Get('owner/:ownerUserId')
  listByOwner(
    @Param('ownerUserId') ownerUserId: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.listByOwner(ownerUserId, user);
  }

  @Get('assigned/me/summary')
  getAssignedSummary(
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.getAssignedSummary(user);
  }

  @Get('owner/:ownerUserId/type/:documentTypeId')
  getPerFormDetail(
    @Param('ownerUserId') ownerUserId: string,
    @Param('documentTypeId') documentTypeId: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.getPerFormDetail(
      ownerUserId,
      documentTypeId,
      user,
    );
  }

  @Get('owner/:ownerUserId/type/:documentTypeId/export')
  async exportPerFormPdf(
    @Param('ownerUserId') ownerUserId: string,
    @Param('documentTypeId') documentTypeId: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, fileName } = await this.documentService.exportPerFormPdf(
      ownerUserId,
      documentTypeId,
      user,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    return new StreamableFile(buffer);
  }

  @Get('summary/:ownerUserId')
  summaryForOwner(
    @Param('ownerUserId') ownerUserId: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.getSummaryForOwner(ownerUserId, user);
  }

  /** Legacy alias used by the frontend (`/documents/per-form/:ownerUserId`). */
  @Get('per-form/:ownerUserId')
  perFormForOwner(
    @Param('ownerUserId') ownerUserId: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.getSummaryForOwner(ownerUserId, user);
  }

  @Get(':id/download-url')
  async getDownloadUrlAlias(
    @Param('id') id: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    const url = await this.documentService.getDownloadUrl(id, user);
    return { url };
  }

  @Get(':id')
  getDocumentById(
    @Param('id') id: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.findDocumentById(id, user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  remove(
    @Param('id') id: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.deleteDocument(id, user);
  }

  @Patch(':id/review')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  review(
    @Param('id') id: string,
    @Body() _body: any,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.reviewDocument(id, user);
  }

  @Post('scan')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  scan(@Body() _body: any) {
    return { success: true };
  }

  @Patch(':id/verify')
  verify(
    @Param('id') id: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.verify(id, user);
  }

  @Get(':id/download')
  getDownloadUrl(
    @Param('id') id: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.getDownloadUrl(id, user);
  }

  @Patch('verify-many')
  verifyMany(
    @Body('ids') ids: string[],
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.verifyMany(ids, user);
  }

  @Post('owner/:ownerUserId/type/:documentTypeId/nudge')
  nudge(
    @Param('ownerUserId') ownerUserId: string,
    @Param('documentTypeId') documentTypeId: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.nudge(ownerUserId, documentTypeId, user);
  }
}
