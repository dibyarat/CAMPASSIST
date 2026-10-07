import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; code: string }) {
    try {
      return await this.prisma.department.create({ data });
    } catch (error) {
      throw new ConflictException('Department with this code or name already exists');
    }
  }

  async findAll() {
    return this.prisma.department.findMany({
      include: { sections: true }
    });
  }

  async findOne(id: string) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async update(id: string, data: { name?: string; code?: string }) {
    return this.prisma.department.update({
      where: { id },
      data
    });
  }

  async remove(id: string) {
    return this.prisma.department.delete({ where: { id } });
  }
}
