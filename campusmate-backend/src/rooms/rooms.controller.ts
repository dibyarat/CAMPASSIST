import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoomStatus } from '../common/enums';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('rooms')
@UseGuards(FirebaseAuthGuard, RolesGuard)
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

  @Delete(':id')
  @Roles('DEVELOPER')
  remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
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


