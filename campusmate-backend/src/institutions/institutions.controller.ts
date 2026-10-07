import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { InstitutionsService } from './institutions.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';

@Controller('institutions')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Post()
  @Roles('DEVELOPER')
  create(@Body() createInstitutionDto: any) {
    return this.institutionsService.create(createInstitutionDto);
  }

  @Get()
  findAll() {
    return this.institutionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.institutionsService.findOne(id);
  }

  @Patch(':id')
  @Roles('DEVELOPER')
  update(@Param('id') id: string, @Body() updateInstitutionDto: any) {
    return this.institutionsService.update(id, updateInstitutionDto);
  }

  @Delete(':id')
  @Roles('DEVELOPER')
  remove(@Param('id') id: string) {
    return this.institutionsService.remove(id);
  }
}
