import { SettingsService } from './settings.service';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';
export declare class SettingsController {
    private readonly settings;
    constructor(settings: SettingsService);
    getPublic(): Promise<import("./settings.service").AppSettingsPublic>;
    getAdmin(): Promise<import("./settings.service").AppSettingsPublic>;
    patch(dto: UpdateAppSettingsDto): Promise<import("./settings.service").AppSettingsPublic>;
}
