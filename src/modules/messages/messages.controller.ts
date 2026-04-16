import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/database.enum';

type Msg = { id: string; subject: string; body: string; status: string; created_at: string };
const MSGS: Msg[] = [];

@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  @Get()
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  list() {
    return MSGS;
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() body: { subject?: string; body?: string }) {
    const msg: Msg = {
      id: String(Date.now()),
      subject: body.subject ?? '(no subject)',
      body: body.body ?? '',
      status: 'sent',
      created_at: new Date().toISOString(),
    };
    MSGS.unshift(msg);
    return msg;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() body: { status?: string }) {
    const msg = MSGS.find((m) => m.id === id);
    if (!msg) return null;
    if (body.status) msg.status = body.status;
    return msg;
  }
}

