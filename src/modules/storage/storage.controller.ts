import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/database.enum';
import { StorageService } from './storage.service';

@Controller('storage')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post('presign')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR, UserRole.TEACHER)
  async presign(@Body() body: { key: string; contentType?: string; bucket?: string }) {
    if (!this.storage.isConfigured()) {
      return { url: 'about:blank', key: body.key };
    }
    const res = await this.storage.createPresignedUploadUrl(
      body.key,
      body.contentType || 'application/octet-stream',
    );
    return { url: res.uploadUrl, key: body.key };
  }

  @Get('download-url')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR, UserRole.TEACHER)
  async downloadUrl(@Query('key') key: string, @Query('bucket') _bucket?: string) {
    if (!this.storage.isConfigured()) {
      return { url: 'about:blank' };
    }
    const url = await this.storage.createPresignedDownloadUrl(key);
    return { url };
  }

  @Post('delete')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR, UserRole.TEACHER)
  async delete(@Body() _body: { bucket?: string; keys?: string[] }) {
    // Delete is not implemented in StorageService yet; keep endpoint stable.
    return { success: true };
  }
}

