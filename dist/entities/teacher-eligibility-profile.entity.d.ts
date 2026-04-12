import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { School } from './school.entity';
export declare class TeacherEligibilityProfile extends BaseEntity {
    userId: string;
    schoolId: string;
    educationLevel: string | null;
    educationField: string | null;
    totalCredits: number | null;
    eceCredits: number | null;
    yearsExperience: number | null;
    resumePath: string | null;
    cdaCredential: boolean;
    stateCertification: boolean;
    firstAidCertified: boolean;
    cprCertified: boolean;
    languages: string | null;
    notes: string | null;
    aiAnalysis: string | null;
    aiAnalyzedAt: Date | null;
    user: User;
    school: School;
}
