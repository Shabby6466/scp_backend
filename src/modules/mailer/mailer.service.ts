import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export type ExpirationReminderTier = '30d' | '7d' | 'expired';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly client: MailerSend | null = null;
  private readonly smtpTransporter: Transporter | null = null;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('MAILERSEND_API_KEY');
    this.fromEmail =
      this.config.get<string>('MAILERSEND_FROM_EMAIL') ??
      'noreply@schoolsystem.com';
    this.fromName =
      this.config.get<string>('MAILERSEND_FROM_NAME') ?? 'School System';

    const transport = (
      this.config.get<string>('MAIL_TRANSPORT') ?? 'api'
    ).toLowerCase();

    if (transport === 'smtp') {
      const host = this.config.get<string>('SMTP_HOST');
      const port = Number.parseInt(
        this.config.get<string>('SMTP_PORT') ?? '587',
        10,
      );
      const user = this.config.get<string>('SMTP_USER');
      const pass = this.config.get<string>('SMTP_PASS');
      const secure = this.config.get<string>('SMTP_SECURE') === 'true';
      if (host && user && pass) {
        this.smtpTransporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
        });
        this.logger.log(`Mailer: using SMTP transport (${host}:${port})`);
      } else {
        this.logger.warn(
          'MAIL_TRANSPORT=smtp but SMTP_HOST / SMTP_USER / SMTP_PASS incomplete; falling back to API or log-only',
        );
      }
    }

    if (!this.smtpTransporter && apiKey) {
      this.client = new MailerSend({ apiKey });
      this.logger.log('Mailer: using MailerSend HTTP API');
    } else if (!this.smtpTransporter && !apiKey) {
      this.logger.warn(
        'MAILERSEND_API_KEY not set and SMTP not configured; emails will be logged only',
      );
    }
  }

  private formatMailerSendError(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (err && typeof err === 'object') {
      const o = err as Record<string, unknown>;
      const body = o.body;
      if (body && typeof body === 'object') {
        const msg = (body as Record<string, unknown>).message;
        if (typeof msg === 'string') return msg;
      }
      if (typeof o.statusCode === 'number') {
        return o.statusCode === 401
          ? 'Unauthenticated (invalid or missing MailerSend API key)'
          : `HTTP ${o.statusCode}`;
      }
    }
    return String(err);
  }

  private async dispatchEmail(
    successLog: string,
    devFallback: () => void,
    toEmail: string,
    subject: string,
    html: string,
    text: string,
  ): Promise<void> {
    if (this.smtpTransporter) {
      try {
        await this.smtpTransporter.sendMail({
          from: `"${this.fromName}" <${this.fromEmail}>`,
          to: toEmail,
          subject,
          html,
          text,
        });
        this.logger.log(successLog);
      } catch (err: unknown) {
        const detail = err instanceof Error ? err.message : String(err);
        this.logger.error(`SMTP send failed: ${detail}`);
        throw new InternalServerErrorException(
          'Email could not be sent. Check SMTP settings.',
        );
      }
      return;
    }

    if (!this.client) {
      devFallback();
      return;
    }

    const emailParams = new EmailParams()
      .setFrom(new Sender(this.fromEmail, this.fromName))
      .setTo([new Recipient(toEmail, toEmail)])
      .setSubject(subject)
      .setHtml(html)
      .setText(text);

    try {
      await this.client.email.send(emailParams);
      this.logger.log(successLog);
    } catch (err: unknown) {
      const detail = this.formatMailerSendError(err);
      this.logger.error(`MailerSend request failed: ${detail}`);
      throw new InternalServerErrorException(
        'Email could not be sent. Check MAILERSEND_API_KEY and that the sender domain is verified in MailerSend.',
      );
    }
  }

  async sendVerificationCode(toEmail: string, code: string): Promise<void> {
    const subject = 'Verify your email';
    const html = `
      <p>Your verification code is: <strong>${code}</strong></p>
      <p>This code expires in 10 minutes. Use it to complete your registration.</p>
    `;
    const text = `Your verification code is: ${code}. This code expires in 10 minutes.`;

    await this.dispatchEmail(
      `Verification email sent to ${toEmail}`,
      () => this.logger.log(`[DEV] Verification code for ${toEmail}: ${code}`),
      toEmail,
      subject,
      html,
      text,
    );
  }

  async sendOtp(toEmail: string, code: string): Promise<void> {
    const subject = 'Your login code';
    const html = `
      <p>Your one-time login code is: <strong>${code}</strong></p>
      <p>This code expires in 10 minutes. Do not share it with anyone.</p>
    `;
    const text = `Your one-time login code is: ${code}. This code expires in 10 minutes.`;

    await this.dispatchEmail(
      `OTP email sent to ${toEmail}`,
      () => this.logger.log(`[DEV] OTP for ${toEmail}: ${code}`),
      toEmail,
      subject,
      html,
      text,
    );
  }

  async sendInvite(
    toEmail: string,
    code: string,
    inviterName?: string,
  ): Promise<void> {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/verify?email=${encodeURIComponent(toEmail)}&invite=1`;

    const subject = 'You have been invited to School System';
    const html = `
      <p>${inviterName ?? 'Someone'} has invited you to School System.</p>
      <p>Your verification code is: <strong>${code}</strong></p>
      <p>This code expires in 10 minutes. <a href="${verifyUrl}">Click here to set your password and verify your email</a>.</p>
    `;
    const text = `You have been invited. Your verification code is: ${code}. Go to ${verifyUrl} to set your password. This code expires in 10 minutes.`;

    await this.dispatchEmail(
      `Invite email sent to ${toEmail}`,
      () => this.logger.log(`[DEV] Invite OTP for ${toEmail}: ${code}`),
      toEmail,
      subject,
      html,
      text,
    );
  }

  async sendDocTypeAssigned(
    toEmail: string,
    documentTypeName: string,
  ): Promise<void> {
    const subject = 'New document assigned';
    const html = `<p>A new required document has been assigned: <strong>${documentTypeName}</strong></p>`;
    const text = `A new required document has been assigned: ${documentTypeName}`;

    await this.dispatchEmail(
      `Document assignment email sent to ${toEmail}`,
      () =>
        this.logger.log(
          `[DEV] Document assigned for ${toEmail}: ${documentTypeName}`,
        ),
      toEmail,
      subject,
      html,
      text,
    );
  }

  async sendDocumentUploadedNotice(
    toEmail: string,
    documentTypeName: string,
  ): Promise<void> {
    const subject = 'Document uploaded';
    const html = `<p>A document upload was completed for: <strong>${documentTypeName}</strong></p>`;
    const text = `A document upload was completed for: ${documentTypeName}`;

    await this.dispatchEmail(
      `Document uploaded notification sent to ${toEmail}`,
      () =>
        this.logger.log(
          `[DEV] Document uploaded notice for ${toEmail}: ${documentTypeName}`,
        ),
      toEmail,
      subject,
      html,
      text,
    );
  }

  async sendDocumentDueReminder(
    toEmail: string,
    documentTypeName: string,
    dueDate: string,
  ): Promise<void> {
    const subject = 'Document due reminder';
    const html = `<p>Your document <strong>${documentTypeName}</strong> is due on <strong>${dueDate}</strong>.</p>`;
    const text = `Your document ${documentTypeName} is due on ${dueDate}.`;

    await this.dispatchEmail(
      `Document due reminder sent to ${toEmail}`,
      () =>
        this.logger.log(
          `[DEV] Document due reminder for ${toEmail}: ${documentTypeName} due ${dueDate}`,
        ),
      toEmail,
      subject,
      html,
      text,
    );
  }

  async sendDocumentExpirationReminder(
    toEmail: string,
    userName: string,
    documentTypeName: string,
    dueDateLabel: string,
    tier: ExpirationReminderTier,
  ): Promise<void> {
    const tierLabel =
      tier === '30d' ? '30-day' : tier === '7d' ? '7-day' : 'Expired';
    const subject =
      tier === 'expired'
        ? `Action required: expired document — ${documentTypeName}`
        : `Document expiration reminder (${tierLabel}) — ${documentTypeName}`;
    const bodyIntro =
      tier === 'expired'
        ? `<p>Your document <strong>${documentTypeName}</strong> has expired (was due <strong>${dueDateLabel}</strong>).</p>`
        : `<p>Your document <strong>${documentTypeName}</strong> expires on <strong>${dueDateLabel}</strong>.</p>`;
    const html = `
      <p>Hello ${userName},</p>
      ${bodyIntro}
      <p>Please log in to the School System portal to renew or replace this document.</p>
    `;
    const text =
      tier === 'expired'
        ? `Hello ${userName}, your document ${documentTypeName} has expired (was due ${dueDateLabel}). Please log in to the School System portal.`
        : `Hello ${userName}, your document ${documentTypeName} expires on ${dueDateLabel}. Please log in to the School System portal.`;

    await this.dispatchEmail(
      `Expiration reminder (${tier}) sent to ${toEmail}`,
      () =>
        this.logger.log(
          `[DEV] Expiration reminder (${tier}) for ${toEmail}: ${documentTypeName} ${dueDateLabel}`,
        ),
      toEmail,
      subject,
      html,
      text,
    );
  }

  async sendDocumentActionReminder(
    toEmail: string,
    userName: string,
    documentTypeName: string,
  ): Promise<void> {
    const subject = `Action Required: ${documentTypeName}`;
    const html = `
      <p>Hello ${userName},</p>
      <p>This is a reminder that your document <strong>${documentTypeName}</strong> requires your attention (either missing or needs re-upload).</p>
      <p>Please log in to the School System portal to complete this requirement.</p>
    `;
    const text = `Hello ${userName}, this is a reminder that your document ${documentTypeName} requires your attention. Please log in to the School System portal.`;

    await this.dispatchEmail(
      `Document action reminder sent to ${toEmail}`,
      () =>
        this.logger.log(
          `[DEV] Document nudge for ${toEmail}: ${documentTypeName}`,
        ),
      toEmail,
      subject,
      html,
      text,
    );
  }
}
