import { ConfigService } from '@nestjs/config';
import type { StorageDriver, PresignedUploadResult } from './storage-driver.interface.js';
export declare class SupabaseStorageDriver implements StorageDriver {
    private readonly config;
    private clientInstance;
    private readonly bucket;
    constructor(config: ConfigService);
    private client;
    isConfigured(): boolean;
    createPresignedUploadUrl(key: string, contentType: string, _expiresInSeconds?: number): Promise<PresignedUploadResult>;
    createPresignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
