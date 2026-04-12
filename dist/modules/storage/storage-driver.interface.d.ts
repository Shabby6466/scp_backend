export type PresignedUploadResult = {
    uploadUrl: string;
    uploadToken?: string;
};
export interface StorageDriver {
    isConfigured(): boolean;
    createPresignedUploadUrl(key: string, contentType: string, expiresInSeconds?: number): Promise<PresignedUploadResult>;
    createPresignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
