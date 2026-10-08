import { Controller, Get, Post, Put, Patch, Delete, Body, UseGuards, Req, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('onboard')
  onboardUser(@Req() req: any, @Body() data: any) {
    const userId = req.user?.id;
    return this.usersService.onboardUser(userId, data.email, data.fullName, data.role, data.rollNumber, data.section, data.institutionCode);
  }

  @Get('me')
  getProfile(@Req() req: any) {
    // req.user would be populated by the AuthGuard in a real implementation
    const userId = req.user?.id || 'mock-user-id';
    return this.usersService.getProfile(userId);
  }

  @Put('me/profile')
  updateProfile(@Req() req: any, @Body() profileData: any) {
    const userId = req.user?.id || 'mock-user-id';
    return this.usersService.updateProfile(userId, profileData);
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

  @Get('cr')
  @Roles('DEVELOPER', 'STUDENT')
  getAllCrs() {
    return this.usersService.getAllUsersByRole('CR');
  }

  @Delete(':id')
  @Roles('DEVELOPER')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}




