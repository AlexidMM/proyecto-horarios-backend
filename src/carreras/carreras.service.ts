import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';


@Injectable()
export class CarrerasService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.carreras.findMany();
  }
  async findById(id: string) {
    return this.prisma.carreras.findUnique({
      where: { id },
    });
  }
  
  async findByNombre(nombre: string) {
    return this.prisma.carreras.findMany({
      where: { nombre },
    });
  }

  async create(data: { nombre: string;  division: string, grado :number }) {
    return this.prisma.carreras.create({
      data,
    });
  }
  async update(id: string, data: Partial<{ nombre: string; division: string, grado :number }>) {
    return this.prisma.carreras.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.carreras.delete({
      where: { id },
    });
  }
}

