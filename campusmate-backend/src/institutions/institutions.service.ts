import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class InstitutionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; code: string }) {
    const existing = await this.prisma.institution.findUnique({ where: { code: data.code } });
    if (existing) {
      throw new ConflictException('Institution code already exists');
    }
    return this.prisma.institution.create({ data });
  }

  findAll() {
    return this.prisma.institution.findMany({
      include: {
        _count: {
          select: { users: true, sections: true }
        }
      }
    });
  }

  findOne(id: string) {
    return this.prisma.institution.findUnique({ where: { id } });
  }

  update(id: string, data: { name?: string; code?: string }) {
    return this.prisma.institution.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.user.updateMany({
        where: { institutionId: id },
        data: { institutionId: null }
      });
      await transaction.section.updateMany({
        where: { institutionId: id },
        data: { institutionId: null }
      });
      return transaction.institution.delete({ where: { id } });
    });
  }
}
