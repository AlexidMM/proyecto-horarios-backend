import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';


@Injectable()
export class SalonesService {
    constructor(private prisma: PrismaService) {}

    async findAll() {
        return this.prisma.salones.findMany({
            include: { edificio: true },
        });
    }

    async findById(id: string) {
        return this.prisma.salones.findUnique({
            where: { id },
            include: { edificio: true },
        });
    }
    async findByNombreYEdificio(nombre: string, edificio_id: string) {
  return this.prisma.salones.findFirst({
    where: { nombre, edificio_id }
  });
}

    async create(data: {
        nombre: string;
        edificio_id: string;
        capacidad?: number;
        data?: object;
    }) {
        return this.prisma.salones.create({
            data,
        });
    }

    async update(id: string, data: Partial<{
        nombre: string;
        edificio_id: string;
        capacidad: number;
        data: object;
    }>) {
        return this.prisma.salones.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        return this.prisma.salones.delete({
            where: { id },
        });
    }
}

