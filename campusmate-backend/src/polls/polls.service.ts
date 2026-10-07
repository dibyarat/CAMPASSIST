import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class PollsService {
  constructor(private prisma: PrismaService) {}

  async createPoll(creatorId: string, data: any) {
    // Uses a transaction to ensure Poll and PollOptions are created together safely
    return this.prisma.$transaction(async (prisma) => {
      const poll = await prisma.poll.create({
        data: {
          title: data.title,
          description: data.description,
          target: data.target,
          creatorId,
          endDate: data.endDate
        }
      });

      await prisma.pollOption.createMany({
        data: data.options.map((opt: string) => ({
          pollId: poll.id,
          text: opt
        }))
      });

      return prisma.poll.findUnique({ where: { id: poll.id }, include: { options: true } });
    });
  }

  async vote(userId: string, pollId: string, optionId: string) {
    try {
      // The schema @@unique([pollId, userId]) guarantees they cannot vote twice at the DB level
      return await this.prisma.pollVote.create({
        data: {
          pollId,
          optionId,
          userId
        }
      });
    } catch (error) {
      throw new ConflictException('You have already voted on this poll');
    }
  }

  async getActivePolls() {
    return this.prisma.poll.findMany({
      where: { status: 'ACTIVE' },
      include: { 
        options: {
          include: { _count: { select: { votes: true } } }
        }
      }
    });
  }
}
