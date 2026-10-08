import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('events')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  list() { return this.eventsService.list(); }

  @Post()
  @Roles('CR', 'DEVELOPER')
  create(@CurrentUser() user: any, @Body() data: any) { return this.eventsService.create(user.id, data); }

  @Post(':id/register')
  @Roles('STUDENT', 'CR', 'DEVELOPER')
  register(@Param('id') eventId: string, @CurrentUser() user: any) { return this.eventsService.register(eventId, user.id); }
}