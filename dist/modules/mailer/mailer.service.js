"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MailerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mailersend_1 = require("mailersend");
let MailerService = MailerService_1 = class MailerService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(MailerService_1.name);
        this.client = null;
        const apiKey = this.config.get('MAILERSEND_API_KEY');
        this.fromEmail =
            this.config.get('MAILERSEND_FROM_EMAIL') ??
                'noreply@schoolsystem.com';
        this.fromName =
            this.config.get('MAILERSEND_FROM_NAME') ?? 'School System';
        if (apiKey) {
            this.client = new mailersend_1.MailerSend({ apiKey });
        }
        else {
            this.logger.warn('MAILERSEND_API_KEY not set; emails will be logged only');
        }
    }
    formatMailerSendError(err) {
        if (err instanceof Error)
            return err.message;
        if (err && typeof err === 'object') {
            const o = err;
            const body = o.body;
            if (body && typeof body === 'object') {
                const msg = body.message;
                if (typeof msg === 'string')
                    return msg;
            }
            if (typeof o.statusCode === 'number') {
                return o.statusCode === 401
                    ? 'Unauthenticated (invalid or missing MailerSend API key)'
                    : `HTTP ${o.statusCode}`;
            }
        }
        return String(err);
    }
    async dispatchEmail(successLog, send, devFallback) {
        if (!this.client) {
            devFallback();
            return;
        }
        try {
            await send(this.client);
            this.logger.log(successLog);
        }
        catch (err) {
            const detail = this.formatMailerSendError(err);
            this.logger.error(`MailerSend request failed: ${detail}`);
            throw new common_1.InternalServerErrorException('Email could not be sent. Check MAILERSEND_API_KEY and that the sender domain is verified in MailerSend.');
        }
    }
    async sendVerificationCode(toEmail, code) {
        const subject = 'Verify your email';
        const html = `
      <p>Your verification code is: <strong>${code}</strong></p>
      <p>This code expires in 10 minutes. Use it to complete your registration.</p>
    `;
        const text = `Your verification code is: ${code}. This code expires in 10 minutes.`;
        const emailParams = new mailersend_1.EmailParams()
            .setFrom(new mailersend_1.Sender(this.fromEmail, this.fromName))
            .setTo([new mailersend_1.Recipient(toEmail, toEmail)])
            .setSubject(subject)
            .setHtml(html)
            .setText(text);
        await this.dispatchEmail(`Verification email sent to ${toEmail}`, (client) => client.email.send(emailParams), () => this.logger.log(`[DEV] Verification code for ${toEmail}: ${code}`));
    }
    async sendOtp(toEmail, code) {
        const subject = 'Your login code';
        const html = `
      <p>Your one-time login code is: <strong>${code}</strong></p>
      <p>This code expires in 10 minutes. Do not share it with anyone.</p>
    `;
        const text = `Your one-time login code is: ${code}. This code expires in 10 minutes.`;
        const emailParams = new mailersend_1.EmailParams()
            .setFrom(new mailersend_1.Sender(this.fromEmail, this.fromName))
            .setTo([new mailersend_1.Recipient(toEmail, toEmail)])
            .setSubject(subject)
            .setHtml(html)
            .setText(text);
        await this.dispatchEmail(`OTP email sent to ${toEmail}`, (client) => client.email.send(emailParams), () => this.logger.log(`[DEV] OTP for ${toEmail}: ${code}`));
    }
    async sendInvite(toEmail, code, inviterName) {
        const frontendUrl = this.config.get('FRONTEND_URL') ?? 'http://localhost:3000';
        const verifyUrl = `${frontendUrl}/verify?email=${encodeURIComponent(toEmail)}&invite=1`;
        const subject = 'You have been invited to School System';
        const html = `
      <p>${inviterName ?? 'Someone'} has invited you to School System.</p>
      <p>Your verification code is: <strong>${code}</strong></p>
      <p>This code expires in 10 minutes. <a href="${verifyUrl}">Click here to set your password and verify your email</a>.</p>
    `;
        const text = `You have been invited. Your verification code is: ${code}. Go to ${verifyUrl} to set your password. This code expires in 10 minutes.`;
        const emailParams = new mailersend_1.EmailParams()
            .setFrom(new mailersend_1.Sender(this.fromEmail, this.fromName))
            .setTo([new mailersend_1.Recipient(toEmail, toEmail)])
            .setSubject(subject)
            .setHtml(html)
            .setText(text);
        await this.dispatchEmail(`Invite email sent to ${toEmail}`, (client) => client.email.send(emailParams), () => this.logger.log(`[DEV] Invite OTP for ${toEmail}: ${code}`));
    }
    async sendDocTypeAssigned(toEmail, documentTypeName) {
        const subject = 'New document assigned';
        const html = `<p>A new required document has been assigned: <strong>${documentTypeName}</strong></p>`;
        const text = `A new required document has been assigned: ${documentTypeName}`;
        const emailParams = new mailersend_1.EmailParams()
            .setFrom(new mailersend_1.Sender(this.fromEmail, this.fromName))
            .setTo([new mailersend_1.Recipient(toEmail, toEmail)])
            .setSubject(subject)
            .setHtml(html)
            .setText(text);
        await this.dispatchEmail(`Document assignment email sent to ${toEmail}`, (client) => client.email.send(emailParams), () => this.logger.log(`[DEV] Document assigned for ${toEmail}: ${documentTypeName}`));
    }
    async sendDocumentUploadedNotice(toEmail, documentTypeName) {
        const subject = 'Document uploaded';
        const html = `<p>A document upload was completed for: <strong>${documentTypeName}</strong></p>`;
        const text = `A document upload was completed for: ${documentTypeName}`;
        const emailParams = new mailersend_1.EmailParams()
            .setFrom(new mailersend_1.Sender(this.fromEmail, this.fromName))
            .setTo([new mailersend_1.Recipient(toEmail, toEmail)])
            .setSubject(subject)
            .setHtml(html)
            .setText(text);
        await this.dispatchEmail(`Document uploaded notification sent to ${toEmail}`, (client) => client.email.send(emailParams), () => this.logger.log(`[DEV] Document uploaded notice for ${toEmail}: ${documentTypeName}`));
    }
    async sendDocumentDueReminder(toEmail, documentTypeName, dueDate) {
        const subject = 'Document due reminder';
        const html = `<p>Your document <strong>${documentTypeName}</strong> is due on <strong>${dueDate}</strong>.</p>`;
        const text = `Your document ${documentTypeName} is due on ${dueDate}.`;
        const emailParams = new mailersend_1.EmailParams()
            .setFrom(new mailersend_1.Sender(this.fromEmail, this.fromName))
            .setTo([new mailersend_1.Recipient(toEmail, toEmail)])
            .setSubject(subject)
            .setHtml(html)
            .setText(text);
        await this.dispatchEmail(`Document due reminder sent to ${toEmail}`, (client) => client.email.send(emailParams), () => this.logger.log(`[DEV] Document due reminder for ${toEmail}: ${documentTypeName} due ${dueDate}`));
    }
    async sendDocumentActionReminder(toEmail, userName, documentTypeName) {
        const subject = `Action Required: ${documentTypeName}`;
        const html = `
      <p>Hello ${userName},</p>
      <p>This is a reminder that your document <strong>${documentTypeName}</strong> requires your attention (either missing or needs re-upload).</p>
      <p>Please log in to the School System portal to complete this requirement.</p>
    `;
        const text = `Hello ${userName}, this is a reminder that your document ${documentTypeName} requires your attention. Please log in to the School System portal.`;
        const emailParams = new mailersend_1.EmailParams()
            .setFrom(new mailersend_1.Sender(this.fromEmail, this.fromName))
            .setTo([new mailersend_1.Recipient(toEmail, toEmail)])
            .setSubject(subject)
            .setHtml(html)
            .setText(text);
        await this.dispatchEmail(`Document action reminder sent to ${toEmail}`, (client) => client.email.send(emailParams), () => this.logger.log(`[DEV] Document nudge for ${toEmail}: ${documentTypeName}`));
    }
};
exports.MailerService = MailerService;
exports.MailerService = MailerService = MailerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailerService);
//# sourceMappingURL=mailer.service.js.map