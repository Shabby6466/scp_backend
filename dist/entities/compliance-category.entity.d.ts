import { BaseEntity } from './base.entity';
import { School } from './school.entity';
import { User } from './user.entity';
import { DocumentType } from './document.entity';
export declare class ComplianceCategory extends BaseEntity {
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    sortOrder: number;
    schoolId: string;
    createdById: string;
    school: School;
    createdBy: User;
    documentTypes: DocumentType[];
}
