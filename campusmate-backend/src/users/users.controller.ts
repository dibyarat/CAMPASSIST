import { Controller, Get, Post, Put, Patch, Delete, Body, UseGuards, Req, Param, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { UpdateUserDetailsDto } from './update-user-details.dto';

@Controller('users')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('onboard')
  onboardUser(@Req() req: any, @Body() data: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.usersService.onboardUser(userId, data.email, data.fullName, Role.STUDENT, data.rollNumber, data.section, data.institutionCode);
  }

  @Get('me')
  getProfile(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.usersService.getProfile(userId);
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Put('me/profile')
  updateProfile(@Req() req: any, @Body() profileData: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.usersService.updateProfile(userId, profileData);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Delete('me/account')
  deleteMyAccount(@Req() req: any, @Body() body: { confirmation?: string }) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    if (body?.confirmation !== 'DELETE_MY_ACCOUNT') {
      throw new BadRequestException('Confirmation required: body must contain confirmation="DELETE_MY_ACCOUNT"');
    }
    return this.usersService.deleteSelfAccount(userId);
  }

  @Get()
  @Roles('DEVELOPER')
  getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Patch(':id/role')
  @Roles('DEVELOPER')
  updateRole(@Param('id') id: string, @Body() data: { role: string; sectionId?: string }) {
    return this.usersService.updateUserRole(id, data.role, data.sectionId);
  }

  @Patch(':id/profile')
  @Roles('DEVELOPER')
  updateUserDetails(@Param('id') id: string, @Body() data: UpdateUserDetailsDto) {
    return this.usersService.updateUserDetails(id, data);
  }

  @Get('cr')
  @Roles('DEVELOPER', 'STUDENT', 'CR')
  getAllCrs() {
    return this.usersService.getAllUsersByRole('CR');
  }

  @Delete(':id')
  @Roles('DEVELOPER')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}




