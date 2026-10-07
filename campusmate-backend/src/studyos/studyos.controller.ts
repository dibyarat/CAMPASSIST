import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { StudyosService } from './studyos.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('studyos/academic')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class StudyosController {
  constructor(private readonly studyosService: StudyosService) {}

  @Post()
  @Roles('DEVELOPER', 'CR')
  createResource(@Body() data: any, @CurrentUser() user: any) {
    // Expected that file is already uploaded to Supabase Storage by the client
    // Client sends the `fileReference` path here to store the metadata
    return this.studyosService.uploadAcademicResource({ ...data, uploaderId: user.id });
  }

  @Get()
  // Open to all students to find resources
  getResources(@Query('subjectId') subjectId: string) {
    return this.studyosService.getAcademicResources(subjectId);
  }

  @Get('download/:fileRef')
  getSignedUrl(@Param('fileRef') fileReference: string) {
    // Decodes the reference if passed as URL parameter
    const decodedRef = decodeURIComponent(fileReference);
    return this.studyosService.getDownloadUrl(decodedRef);
  }
}

