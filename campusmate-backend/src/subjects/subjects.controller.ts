import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('DEVELOPER')
  create(@Body() data: { code: string; name: string; credits: number; type: string }) {
    return this.subjectsService.create(data);
  }

  @Get()
  @UseGuards(SupabaseAuthGuard)
  findAll() {
    return this.subjectsService.findAll();
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('DEVELOPER')
  update(@Param('id') id: string, @Body() data: any) {
    return this.subjectsService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('DEVELOPER')
  remove(@Param('id') id: string) {
    return this.subjectsService.remove(id);
  }
}
