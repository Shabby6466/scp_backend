import { BaseEntity } from './base.entity';
import { School } from './school.entity';
import { TeacherProfile } from './teacher-profile.entity';
export declare class TeacherPosition extends BaseEntity {
    schoolId: string;
    name: string;
    description: string | null;
    minEducationLevel: string | null;
    minCredits: number | null;
    minEceCredits: number | null;
    minYearsExperience: number | null;
    requiresCda: boolean;
    requiresStateCert: boolean;
    isActive: boolean;
    school: School;
    teachers: TeacherProfile[];
}
