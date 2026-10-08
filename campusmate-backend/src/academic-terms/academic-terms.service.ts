import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AcademicTermsService {
  constructor(private prisma: PrismaService) {}

  async getCurrent() {
    const term = await this.prisma.academicTerm.findFirst({
      where: { isCurrent: true },
      orderBy: { startDate: 'desc' }
    }) || await this.prisma.academicTerm.findFirst({ orderBy: { startDate: 'desc' } });

    if (!term) throw new NotFoundException('No academic term is configured');
    return term;
  }
}