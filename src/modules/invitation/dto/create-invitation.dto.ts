import { UserRole } from '../../common/enums/database.enum';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateInvitationDto {
  @IsString()
  @MinLength(1)
  schoolId!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  branchId?: string;

  @IsEmail()
  email!: string;

  @IsEnum(UserRole)
  role!: UserRole;
}
