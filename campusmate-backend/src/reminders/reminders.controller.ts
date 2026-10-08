import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('reminders')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get('mine')
  findMine(@CurrentUser() user: any) {
    return this.remindersService.findMine(user.id);
  }

  @Get('relevant')
  findRelevant(@CurrentUser() user: any) {
    return this.remindersService.findRelevant(user);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() data: {
    category: string;
    priority?: string;
    schedule?: string;
    title: string;
    description?: string;
    dueDate: string;
  }) {
    return this.remindersService.create(user.id, data);
  }

  @Post('section')
  createForSection(@CurrentUser() user: any, @Body() data: {
    category: string;
    priority?: string;
    schedule?: string;
    title: string;
    description?: string;
    dueDate: string;
  }) {
    if (!user.crAssignment?.isActive) throw new ForbiddenException('No active CR assignment');
    return this.remindersService.createForSection(user.id, user.crAssignment.sectionId, data);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.remindersService.remove(user.id, id);
  }
}