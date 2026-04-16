import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type ConsentRow = {
  id: string;
  user_id: string;
  consent_given: boolean;
  consent_date: string;
  privacy_policy_version: string | null;
};

// In-memory placeholder until a persistent consent table exists.
const CONSENTS = new Map<string, ConsentRow>();

@Controller('user-consent')
@UseGuards(JwtAuthGuard)
export class UserConsentController {
  @Get()
  list(): ConsentRow[] {
    return [...CONSENTS.values()];
  }

  @Post()
  upsert(
    @Body()
    body: {
      user_id: string;
      consent_given: boolean;
      privacy_policy_version?: string | null;
    },
  ): ConsentRow {
    const now = new Date().toISOString();
    const existing = CONSENTS.get(body.user_id);
    const row: ConsentRow = {
      id: existing?.id ?? body.user_id,
      user_id: body.user_id,
      consent_given: !!body.consent_given,
      consent_date: now,
      privacy_policy_version: body.privacy_policy_version ?? null,
    };
    CONSENTS.set(body.user_id, row);
    return row;
  }
}

