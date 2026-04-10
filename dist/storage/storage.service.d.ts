import { ConfigService } from '@nestjs/config';
import type { PresignedUploadResult } from './storage-driver.interface.js';
export declare class StorageService {
    private readonly config;
    private readonly driver;
    constructor(config: ConfigService);
    buildDocumentKey(schoolId: string, branchId: string, category: string, entityId: string, fileName: string): string;
    isConfigured(): boolean;
    createPresignedUploadUrl(key: string, contentType: string, expiresInSeconds?: number): Promise<PresignedUploadResult>;
    createPresignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
