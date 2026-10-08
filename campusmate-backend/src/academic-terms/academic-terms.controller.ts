import { Controller, Get, UseGuards } from '@nestjs/common';
import { AcademicTermsService } from './academic-terms.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('academic-terms')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class AcademicTermsController {
  constructor(private readonly academicTermsService: AcademicTermsService) {}

  @Get('current')
  getCurrent() {
    return this.academicTermsService.getCurrent();
  }
}