import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('events')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  list(@CurrentUser() user: any, @Query('includeAll') includeAll: boolean | string = false) {
    const canViewAll = user?.role === 'DEVELOPER';
    const includeAllRequested = includeAll === true || includeAll === 'true';
    return this.eventsService.list(canViewAll && includeAllRequested);
  }

  @Post()
  @Roles('CR', 'DEVELOPER')
  create(@CurrentUser() user: any, @Body() data: any) { return this.eventsService.create(user.id, data); }

  @Post(':id/register')
  @Roles('STUDENT', 'CR', 'DEVELOPER')
  register(@Param('id') eventId: string, @CurrentUser() user: any) { return this.eventsService.register(eventId, user.id); }

  @Delete(':id')
  @Roles('DEVELOPER')
  remove(@Param('id') eventId: string) { return this.eventsService.remove(eventId); }
}