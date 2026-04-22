import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EdificiosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.edificios.findMany({
      include: { salones: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.edificios.findUnique({
      where: { id },
      include: { salones: true },
    });
  }

  async findByName(nombre: string) {
    return this.prisma.edificios.findFirst({ where: { nombre } });
  }

  async create(data: { nombre: string; descripcion?: string }) {
    return this.prisma.edificios.create({ data });
  }

  async update(id: string, data: Partial<{ nombre: string; descripcion?: string }>) {
    return this.prisma.edificios.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.edificios.delete({ where: { id } });
  }
}
