import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../common/enums/database.enum';
import { AnalyticsService } from '../analytics/analytics.service';
import { DocumentService } from '../document/document.service';
import { MailerService } from '../mailer/mailer.service';
import { isWithinCooldown, reminderTierFromPayload } from './reminder-policy.util';
import type { SendReminderDto } from './dto/send-reminder.dto';

type CurrentUser = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
};

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly analytics: AnalyticsService,
    private readonly documents: DocumentService,
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {}

  private async runSend(
    user: CurrentUser,
    body: SendReminderDto,
    opts: { allowAdminGlobal: boolean },
  ) {
    const cooldownDays = Number.parseInt(
      this.config.get<string>('REMINDER_COOLDOWN_DAYS') ?? '7',
      10,
    );
    const batchLimit = Number.parseInt(
      this.config.get<string>('REMINDER_BATCH_LIMIT') ?? '500',
      10,
    );

    const loc = this.analytics.resolveReminderDocumentScope(
      user,
      body.schoolId,
      body.branchId,
      { allowAdminGlobal: opts.allowAdminGlobal },
    );

    const tier = reminderTierFromPayload(body.threshold, body.includeExpired);
    const now = new Date();

    const candidates = await this.documents.findReminderCandidates(
      loc,
      tier,
      now,
      batchLimit,
    );

    let sent = 0;
    let skippedCooldown = 0;
    let skippedNoEmail = 0;
    let failed = 0;

    for (const doc of candidates) {
      const sentField =
        tier === '30d'
          ? doc.reminder30dSentAt
          : tier === '7d'
            ? doc.reminder7dSentAt
            : doc.reminderExpiredSentAt;
      if (isWithinCooldown(sentField, now, cooldownDays)) {
        skippedCooldown++;
        continue;
      }
      const email = doc.ownerUser?.email?.trim();
      if (!email) {
        skippedNoEmail++;
        continue;
      }
      const userName = doc.ownerUser?.name?.trim() || email;
      const typeName = doc.documentType?.name ?? 'Document';
      const due = doc.expiresAt
        ? new Date(doc.expiresAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : '';

      try {
        await this.mailer.sendDocumentExpirationReminder(
          email,
          userName,
          typeName,
          due,
          tier,
        );
        await this.documents.markReminderSent(doc.id, tier, now);
        sent++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.warn(`Reminder failed for document ${doc.id}: ${msg}`);
        failed++;
      }
    }

    return {
      success: true,
      sent,
      skipped: skippedCooldown + skippedNoEmail,
      skippedCooldown,
      skippedNoEmail,
      failed,
      totalCandidates: candidates.length,
      tier,
      message: `Processed ${candidates.length} candidate(s); sent ${sent}.`,
    };
  }

  /** Platform admin: optional global sweep when `schoolId` / `branchId` omitted. */
  async sendAdminReminders(user: CurrentUser, body: SendReminderDto) {
    return this.runSend(user, body, { allowAdminGlobal: true });
  }

  /** School staff: must be scoped to a school or branch (enforced in analytics). */
  async sendSchoolExpirationReminders(user: CurrentUser, body: SendReminderDto) {
    return this.runSend(user, body, { allowAdminGlobal: false });
  }
}
