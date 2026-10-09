import { StudentType } from '../common/enums';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDetailsDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsOptional()
  @IsString()
  rollNumber?: string | null;

  @IsOptional()
  @IsString()
  department?: string | null;

  @IsOptional()
  @IsString()
  semester?: string | null;

  @IsOptional()
  @IsEnum(StudentType)
  studentType?: StudentType;

  @IsOptional()
  @IsString()
  hostelName?: string | null;

  @IsOptional()
  @IsString()
  hostelBlock?: string | null;

  @IsOptional()
  @IsString()
  hostelRoom?: string | null;

  @IsOptional()
  @IsString()
  github?: string | null;

  @IsOptional()
  @IsString()
  linkedin?: string | null;

  @IsOptional()
  @IsString()
  portfolio?: string | null;

  @IsOptional()
  @IsString()
  sectionId?: string | null;

  @IsOptional()
  @IsString()
  institutionId?: string | null;
}