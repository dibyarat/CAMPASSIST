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
    const user = await usersController.getProfile({ user: { id: '32fd7af0-99aa-4746-a9d1-e88091300450' } });
    console.log("Success!", user.email);
  } catch (e) {
    console.error("Error:", e);
  }
}
bootstrap();
