import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UserRole } from '../common/enums/database.enum';
import { SettingsService } from './settings.service';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) { }

  /** Unauthenticated: drives login / register / verify UI. */
  @Get('public')
  getPublic() {
    return this.settings.getPublic();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getAdmin() {
    return this.settings.getPublic();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  patch(@Body() dto: UpdateAppSettingsDto) {
    return this.settings.update(dto);
  }
}
