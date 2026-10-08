import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './src/users/users.controller';
import { UsersService } from './src/users/users.service';
import { PrismaService } from './src/common/prisma.service';

async function bootstrap() {
  const moduleRef = await Test.createTestingModule({
    controllers: [UsersController],
    providers: [UsersService, PrismaService],
  }).compile();

  const usersController = moduleRef.get<UsersController>(UsersController);
  try {
    const users = await usersController.getAllUsers();
    console.log("Success! Users count:", users.length);
  } catch (e) {
    console.error("Error:", e);
  }
}
bootstrap();
