import { ConfigService } from '@nestjs/config';
export declare class MailerService {
    private readonly config;
    private readonly logger;
    private readonly client;
    private readonly fromEmail;
    private readonly fromName;
    constructor(config: ConfigService);
    private formatMailerSendError;
    private dispatchEmail;
    sendVerificationCode(toEmail: string, code: string): Promise<void>;
    sendOtp(toEmail: string, code: string): Promise<void>;
    sendInvite(toEmail: string, code: string, inviterName?: string): Promise<void>;
    sendDocTypeAssigned(toEmail: string, documentTypeName: string): Promise<void>;
    sendDocumentUploadedNotice(toEmail: string, documentTypeName: string): Promise<void>;
    sendDocumentDueReminder(toEmail: string, documentTypeName: string, dueDate: string): Promise<void>;
    sendDocumentActionReminder(toEmail: string, userName: string, documentTypeName: string): Promise<void>;
}
