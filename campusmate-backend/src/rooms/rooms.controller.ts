import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoomStatus } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('rooms')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @Roles('DEVELOPER')
  create(@Body() createRoomDto: any) {
    return this.roomsService.create(createRoomDto);
  }

  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @Get('available')
  getAvailableRooms() {
    return this.roomsService.getAvailableRooms();
  }

  @Patch(':id/report')
  @Roles('CR', 'DEVELOPER')
  reportRoomStatus(
    @Param('id') roomId: string, 
    @Body() data: { status: RoomStatus; notes?: string },
    @CurrentUser() user: any
  ) {
    return this.roomsService.updateStatus(roomId, data.status, user.id, data.notes);
  }
}

