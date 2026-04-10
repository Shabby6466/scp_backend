export type FormsBucket = 'day' | 'week' | 'month';
export declare class FormsAnalyticsQueryDto {
    from: string;
    to: string;
    bucket: FormsBucket;
    documentTypeId?: string;
}
