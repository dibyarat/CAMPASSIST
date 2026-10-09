import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  type?: string;
}

export class UpdateFeedbackStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;
}

