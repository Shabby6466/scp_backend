import { ConfigService } from '@nestjs/config';
import type { StorageDriver, PresignedUploadResult } from './storage-driver.interface.js';
export declare class S3StorageDriver implements StorageDriver {
    private readonly config;
    private readonly client;
    private readonly bucket;
    constructor(config: ConfigService);
    isConfigured(): boolean;
    createPresignedUploadUrl(key: string, contentType: string, expiresInSeconds?: number): Promise<PresignedUploadResult>;
    createPresignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
