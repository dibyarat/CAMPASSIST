import { Controller, Get, Post, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('exams')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  @Roles('DEVELOPER')
  createExam(@Body() data: any) {
    return this.examsService.createExam(data);
  }

  @Get('term/:termId')
  getAllExams(@Param('termId') termId: string) {
    // All authenticated users can see the exam schedule
    return this.examsService.getAllExamsForTerm(termId);
  }

  // --- SEATING ROUTES ---

  @Post(':id/seating-import')
  @Roles('DEVELOPER')
  importSeating(@Param('id') examId: string, @Body() seatingData: any[]) {
    // In reality, a file upload interceptor would process the CSV/XLSX.
    // This endpoint represents the confirmation step of the pipeline.
    return this.examsService.saveSeatingImport(examId, seatingData);
  }

  @Get(':id/my-seat')
  @Roles('STUDENT', 'CR')
  getMySeat(@Param('id') examId: string, @CurrentUser() user: any) {
    // Crucial Rule: Students must only access their own seating.
    if (!user.profile || !user.profile.rollNumber) {
      throw new ForbiddenException('You must have a Roll Number set in your profile to view your exam seat');
    }
    
    return this.examsService.getMyExamSeat(examId, user.profile.rollNumber);
  }
}

