import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { code: string; name: string; credits: number; type: string }) {
    return this.prisma.subject.create({ data });
  }

  async findAll() {
    return this.prisma.subject.findMany();
  }

  async update(id: string, data: any) {
    return this.prisma.subject.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.subject.delete({ where: { id } });
  }
}
