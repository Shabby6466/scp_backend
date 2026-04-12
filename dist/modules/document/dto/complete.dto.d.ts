export declare class CompleteDocumentDto {
    ownerUserId: string;
    documentTypeId: string;
    s3Key: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    expiresAt?: string;
    issuedAt?: string;
}
