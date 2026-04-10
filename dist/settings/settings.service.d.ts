import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto.js';
export interface AppSettingsPublic {
    otpEmailVerificationEnabled: boolean;
    selfRegistrationEnabled: boolean;
}
export declare class SettingsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    ensureDefault(): Promise<{
        otpEmailVerificationEnabled: boolean;
        selfRegistrationEnabled: boolean;
        id: string;
        updatedAt: Date;
    }>;
    getPublic(): Promise<AppSettingsPublic>;
    update(dto: UpdateAppSettingsDto): Promise<AppSettingsPublic>;
}
