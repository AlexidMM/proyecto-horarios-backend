import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';


@Injectable()
export class GruposService {
    constructor(private prisma: PrismaService) {}

    async findAll() {
        return this.prisma.grupos.findMany();
    }

    async findById(id: string) {
        return this.prisma.grupos.findUnique({
            where: { id },
        });
    }

    async create(data: {
        nombre: string;
        division?: string;
        carrera?: string;
        data?: object;
        grado: number;
    }) {
        return this.prisma.grupos.create({
            data: {
                ...data,
                division: data.division?.trim() || 'General',
                carrera: data.carrera?.trim() || 'General',
            },
        });
    }

    async update(id: string, data: Partial<{
        nombre: string;
        division: string;
        carrera: string;
        data?: object;
        grado: number;
    }>) {
        return this.prisma.grupos.update({
            where: { id },
            data: {
                ...data,
                ...(data.division !== undefined ? { division: data.division || 'General' } : {}),
                ...(data.carrera !== undefined ? { carrera: data.carrera || 'General' } : {}),
            },
        });
    }

    async delete(id: string) {
        return this.prisma.grupos.delete({
            where: { id },
        });
    }
}

