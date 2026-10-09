import { Controller, Get, UseGuards } from '@nestjs/common';
import { AcademicTermsService } from './academic-terms.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('academic-terms')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class AcademicTermsController {
  constructor(private readonly academicTermsService: AcademicTermsService) {}

  @Get('current')
  getCurrent() {
    return this.academicTermsService.getCurrent();
  }
}