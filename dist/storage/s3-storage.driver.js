"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3StorageDriver = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
class S3StorageDriver {
    config;
    client;
    bucket;
    constructor(config) {
        this.config = config;
        const region = this.config.get('AWS_REGION') ?? 'us-east-1';
        this.bucket = this.config.get('S3_BUCKET_NAME') ?? '';
        this.client = new client_s3_1.S3Client({
            region,
            credentials: this.config.get('AWS_ACCESS_KEY_ID') &&
                this.config.get('AWS_SECRET_ACCESS_KEY')
                ? {
                    accessKeyId: this.config.getOrThrow('AWS_ACCESS_KEY_ID'),
                    secretAccessKey: this.config.getOrThrow('AWS_SECRET_ACCESS_KEY'),
                }
                : undefined,
        });
    }
    isConfigured() {
        return !!this.bucket && !!this.config.get('AWS_ACCESS_KEY_ID');
    }
    async createPresignedUploadUrl(key, contentType, expiresInSeconds = 900) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: contentType,
        });
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, {
            expiresIn: expiresInSeconds,
        });
        return { uploadUrl };
    }
    async createPresignedDownloadUrl(key, expiresInSeconds = 3600) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        return (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn: expiresInSeconds });
    }
}
exports.S3StorageDriver = S3StorageDriver;
//# sourceMappingURL=s3-storage.driver.js.map