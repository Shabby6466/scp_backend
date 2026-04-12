import { Repository } from 'typeorm';
import { AppConfig } from '../../entities/app-config.entity';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';
export interface AppSettingsPublic {
    otpEmailVerificationEnabled: boolean;
    selfRegistrationEnabled: boolean;
}
export declare class SettingsService {
    private readonly appConfigRepository;
    constructor(appConfigRepository: Repository<AppConfig>);
    ensureDefault(): Promise<AppConfig>;
    getPublic(): Promise<AppSettingsPublic>;
    update(dto: UpdateAppSettingsDto): Promise<AppSettingsPublic>;
}
