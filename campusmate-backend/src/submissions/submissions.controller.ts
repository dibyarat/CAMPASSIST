import { Controller, Get, Post, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('submissions')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @Roles('STUDENT', 'CR')
  upsertSubmission(@Body() data: any, @CurrentUser() user: any) {
    if (!user.student) throw new ForbiddenException('Must have a student profile');
    // Rule enforced: CampusMate has no teacher portal. Students self-report their submission status.
    return this.submissionsService.createOrUpdateSubmission(user.student.id, data);
  }

  @Get('mine')
  @Roles('STUDENT', 'CR')
  getMySubmissions(@CurrentUser() user: any) {
    if (!user.student) throw new ForbiddenException('Must have a student profile');
    return this.submissionsService.getMySubmissions(user.student.id);
  }
}

