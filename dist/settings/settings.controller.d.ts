import { SettingsService } from './settings.service.js';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto.js';
export declare class SettingsController {
    private readonly settings;
    constructor(settings: SettingsService);
    getPublic(): Promise<import("./settings.service.js").AppSettingsPublic>;
    getAdmin(): Promise<import("./settings.service.js").AppSettingsPublic>;
    patch(dto: UpdateAppSettingsDto): Promise<import("./settings.service.js").AppSettingsPublic>;
}
