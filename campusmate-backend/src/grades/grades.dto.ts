import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class GradeEntryDto {
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  grade: string;

  @IsNumber()
  gradePoint: number;

  @IsNumber()
  credits: number;
}

export class CreateAcademicRecordDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  termId: string;

  @IsOptional()
  @IsNumber()
  sgpa?: number;

  @IsOptional()
  @IsNumber()
  cgpa?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeEntryDto)
  grades: GradeEntryDto[];
}
