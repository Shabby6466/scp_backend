import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type {
  StorageDriver,
  PresignedUploadResult,
} from './storage-driver.interface';
import { S3StorageDriver } from './s3-storage.driver';
import { SupabaseStorageDriver } from './supabase-storage.driver';

/**
 * Object storage facade.
 * - `STORAGE_PROVIDER=supabase` — Supabase Storage only.
 * - `STORAGE_PROVIDER=s3` — AWS S3 only.
 * - `STORAGE_PROVIDER=auto` or unset — use Supabase if configured, else S3 if configured, else Supabase (will report not configured until env is set).
 */
@Injectable()
export class StorageService {
  private readonly driver: StorageDriver;

  constructor(private readonly config: ConfigService) {
    const provider = (this.config.get<string>('STORAGE_PROVIDER') ?? 'auto')
      .trim()
      .toLowerCase();

    if (provider === 's3') {
      this.driver = new S3StorageDriver(this.config);
      return;
    }
    if (provider === 'supabase') {
      this.driver = new SupabaseStorageDriver(this.config);
      return;
    }

    const supa = new SupabaseStorageDriver(this.config);
    const s3 = new S3StorageDriver(this.config);
    if (supa.isConfigured()) {
      this.driver = supa;
    } else if (s3.isConfigured()) {
      this.driver = s3;
    } else {
      this.driver = supa;
    }
  }

  /** Same logical key shape for every provider (stored in `Document.s3Key`). */
  buildDocumentKey(
    schoolId: string,
    branchId: string,
    category: string,
    entityId: string,
    fileName: string,
  ): string {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uuid = randomUUID();
    return `schools/${schoolId}/branches/${branchId}/${category}/${entityId}/${uuid}-${safeName}`;
  }

  isConfigured(): boolean {
    return this.driver.isConfigured();
  }

  async createPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds = 900,
  ): Promise<PresignedUploadResult> {
    return this.driver.createPresignedUploadUrl(
      key,
      contentType,
      expiresInSeconds,
    );
  }

  async createPresignedDownloadUrl(
    key: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    return this.driver.createPresignedDownloadUrl(key, expiresInSeconds);
  }
}
