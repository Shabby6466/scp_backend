import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../common/enums/database.enum';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsOptional()
  @IsString()
  schoolId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}
