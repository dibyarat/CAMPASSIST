import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';

@Injectable()
export class PollsService {
  private readonly logger = new Logger(PollsService.name);

  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseAdminService,
  ) {}

  async createPoll(creatorId: string, data: any) {
    const fullPoll = await this.prisma.$transaction(async (prisma) => {
      const poll = await prisma.poll.create({
        data: {
          title: data.title,
          description: data.description,
          target: data.target,
          creatorId,
          endDate: data.endDate,
        },
      });

      await prisma.pollOption.createMany({
        data: data.options.map((opt: string) => ({
          pollId: poll.id,
          text: opt,
        })),
      });

      return prisma.poll.findUnique({ where: { id: poll.id }, include: { options: true } });
    });

    try {
      if (fullPoll) {
        await this.firebase.firestore.collection('polls').doc(fullPoll.id).set({
          ...fullPoll,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      this.logger.warn(`Failed writing poll to Firestore: ${err?.message}`);
    }

    return fullPoll;
  }

  async vote(userId: string, pollId: string, optionId: string) {
    try {
      const vote = await this.prisma.pollVote.create({
        data: {
          pollId,
          optionId,
          userId,
        },
      });

      try {
        await this.firebase.firestore.collection('poll_votes').doc(`${pollId}_${userId}`).set({
          pollId,
          optionId,
          userId,
          createdAt: new Date().toISOString(),
        });
      } catch {}

      return vote;
    } catch {
      throw new ConflictException('You have already voted on this poll');
    }
  }

  async getActivePolls(userId: string) {
    const polls = await this.prisma.poll.findMany({
      where: { status: 'ACTIVE' },
      include: {
        options: {
          include: { _count: { select: { votes: true } } },
        },
        votes: { where: { userId }, select: { id: true } },
      },
    });

    return polls.map(({ votes, ...poll }) => ({ ...poll, hasVoted: votes.length > 0 }));
  }
}
