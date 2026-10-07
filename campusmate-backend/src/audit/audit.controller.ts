import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('audit')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('DEVELOPER')
  async getAuditLogs() {
    return this.auditService.getRecentLogs(100);
  }
}
