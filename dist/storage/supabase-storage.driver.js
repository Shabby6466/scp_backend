"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseStorageDriver = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
class SupabaseStorageDriver {
    config;
    clientInstance;
    bucket;
    constructor(config) {
        this.config = config;
        this.bucket =
            this.config.get('SUPABASE_BUCKET') ??
                this.config.get('STORAGE_BUCKET_NAME') ??
                'documents';
    }
    client() {
        if (!this.clientInstance) {
            const url = this.config.get('SUPABASE_URL')?.trim();
            const key = this.config.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();
            if (!url || !key) {
                throw new Error('Supabase storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
            }
            this.clientInstance = (0, supabase_js_1.createClient)(url, key, {
                auth: { persistSession: false, autoRefreshToken: false },
            });
        }
        return this.clientInstance;
    }
    isConfigured() {
        return !!(this.config.get('SUPABASE_URL')?.trim() &&
            this.config.get('SUPABASE_SERVICE_ROLE_KEY')?.trim() &&
            this.bucket);
    }
    async createPresignedUploadUrl(key, contentType, _expiresInSeconds = 900) {
        try {
            const { data, error } = await this.client()
                .storage.from(this.bucket)
                .createSignedUploadUrl(key);
            if (error) {
                console.error('[SupabaseStorage] createSignedUploadUrl failed:', error);
                throw new Error(`Supabase signed upload URL failed: ${error.message}`);
            }
            if (!data?.signedUrl) {
                throw new Error('Supabase signed upload URL returned no URL');
            }
            return {
                uploadUrl: data.signedUrl,
                uploadToken: data.token,
            };
        }
        catch (err) {
            console.error('[SupabaseStorage] createPresignedUploadUrl unexpected error:', err);
            throw err;
        }
    }
    async createPresignedDownloadUrl(key, expiresInSeconds = 3600) {
        const { data, error } = await this.client()
            .storage.from(this.bucket)
            .createSignedUrl(key, expiresInSeconds);
        if (error) {
            throw new Error(`Supabase signed download URL failed: ${error.message}`);
        }
        if (!data?.signedUrl) {
            throw new Error('Supabase signed download URL returned no URL');
        }
        return data.signedUrl;
    }
}
exports.SupabaseStorageDriver = SupabaseStorageDriver;
//# sourceMappingURL=supabase-storage.driver.js.map