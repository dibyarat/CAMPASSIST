import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateFeedbackDto, UpdateFeedbackStatusDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createFeedbackDto: CreateFeedbackDto) {
    return this.prisma.feedback.create({
      data: {
        ...createFeedbackDto,
        userId,
      },
    });
  }

  async findAll() {
    return this.prisma.feedback.findMany({
      include: {
        user: {
          select: {
            email: true,
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, updateDto: UpdateFeedbackStatusDto) {
    const feedback = await this.prisma.feedback.findUnique({ where: { id } });
    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }
    return this.prisma.feedback.update({
      where: { id },
      data: { status: updateDto.status },
    });
  }
}
