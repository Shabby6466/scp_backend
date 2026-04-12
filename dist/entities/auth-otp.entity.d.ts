import { BaseEntity } from './base.entity';
export declare class AuthOtp extends BaseEntity {
    email: string;
    codeHash: string;
    expiresAt: Date;
    consumedAt: Date | null;
}
