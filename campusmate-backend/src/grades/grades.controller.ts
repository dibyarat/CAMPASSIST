import { Controller, Get, Post, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { GradesService } from './grades.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateAcademicRecordDto } from './grades.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('grades')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get('my-records')
  @Roles('STUDENT', 'CR')
  getMyRecords(@CurrentUser() user: any) {
    if (!user.student) throw new ForbiddenException('No student profile found');
    return this.gradesService.getMyRecords(user.student.id);
  }

  @Post('record')
  @Roles('DEVELOPER')
  upsertRecord(@Body() dto: CreateAcademicRecordDto) {
    return this.gradesService.upsertAcademicRecord(dto);
  }
}
