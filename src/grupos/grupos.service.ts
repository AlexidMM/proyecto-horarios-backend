import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';


@Injectable()
export class GruposService {
    constructor(private prisma: PrismaService) {}

    async findAll() {
        return this.prisma.grupos.findMany({
            include: { _count: { select: { alumnos: true } } },
        });
    }

    async findById(id: string) {
        return this.prisma.grupos.findUnique({
            where: { id },
            include: { _count: { select: { alumnos: true } } },
        });
    }

    async create(data: {
        nombre: string;
        limite_alumnos?: number;
        data?: object;
        grado: number;
    }) {
        return this.prisma.grupos.create({
            data: {
                ...data,
                limite_alumnos: data.limite_alumnos ?? 35,
            },
        });
    }

    async update(id: string, data: Partial<{
        nombre: string;
        limite_alumnos: number;
        data?: object;
        grado: number;
    }>) {
        return this.prisma.grupos.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        return this.prisma.grupos.delete({
            where: { id },
        });
    }
}

