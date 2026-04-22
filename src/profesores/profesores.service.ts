
import { Injectable } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

function buildFallbackEmail(nombre: string, apellidos: string) {
    const normalize = (value: string) =>
        value
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '.')
            .replace(/^\.+|\.+$/g, '');

    const localPart = [normalize(nombre), normalize(apellidos)]
        .filter(Boolean)
        .join('.')
        .replace(/\.+/g, '.');

    return `${localPart || 'profesor'}@escuela.local`;
}

@Injectable()
export class ProfesoresService {
    constructor(private prisma: PrismaService) {}

    private async hasMaxHoraColumn(): Promise<boolean> {
        const result = await this.prisma.$queryRaw<Array<{ exists: boolean }>>`
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'profesores'
                  AND column_name = 'max_hora'
            ) AS "exists";
        `;

        return Boolean(result?.[0]?.exists);
    }

    private normalizeWorkingHours(data: { min_hora?: number; max_hora?: number }) {
        const min_hora = data.min_hora;
        const max_hora = data.max_hora;

        if (min_hora !== undefined && (min_hora < 0 || min_hora > 23)) {
            throw new BadRequestException('min_hora debe estar entre 0 y 23');
        }

        if (max_hora !== undefined && (max_hora < 0 || max_hora > 23)) {
            throw new BadRequestException('max_hora debe estar entre 0 y 23');
        }

        if (min_hora !== undefined && max_hora !== undefined && max_hora < min_hora) {
            throw new BadRequestException('max_hora no puede ser menor que min_hora');
        }
    }

    async findAllTutors() {
        console.log('→ Ejecutando findAllTutors');
        return this.prisma.profesores.findMany({
            where: { can_be_tutor: true },
        });
    }

        async findAll() {
        return this.prisma.profesores.findMany();
    }

        async findAllMovil() {
            return this.prisma.profesores.findMany({
                select: {
                    profesor_id: true,
                    nombre: true,
                    apellidos: true,
                },
            });
        }


    async findById(id: string) {
        console.log('→ Ejecutando findById con id:', id);
        return this.prisma.profesores.findUnique({
            where: { profesor_id: id },
        });
    }


    async create(data: {
        nombre: string;
        apellidos: string;
        email?: string;
        can_be_tutor?: boolean;
        materias?: object;
        metadata?: object;
        min_hora?: number;
        max_hora?: number;
    }) {
        this.normalizeWorkingHours(data);

        const { max_hora, ...dataWithoutMaxHora } = data;

        let created;
        try {
            created = await this.prisma.profesores.create({
                data: {
                    ...dataWithoutMaxHora,
                    email: data.email?.trim() || buildFallbackEmail(data.nombre, data.apellidos),
                },
            });
        } catch (error: any) {
            if (error?.code === 'P2002') {
                throw new BadRequestException('Ya existe un profesor con ese correo');
            }
            throw error;
        }

        if (max_hora !== undefined && await this.hasMaxHoraColumn()) {
            await this.prisma.$executeRaw`
                UPDATE profesores
                SET max_hora = ${max_hora}
                WHERE profesor_id = ${created.profesor_id}::uuid
            `;

            return this.prisma.profesores.findUnique({
                where: { profesor_id: created.profesor_id },
            });
        }

        return created;
    }

    async update(id: string, data: Partial<{
        nombre: string;
        apellidos: string;
        email: string;
        can_be_tutor?: boolean;
        materias?: object;
        metadata?: object;
        min_hora: number;
        max_hora: number;
    }>) {
        this.normalizeWorkingHours(data);

        const { max_hora, ...dataWithoutMaxHora } = data;

        let updated;
        try {
            updated = await this.prisma.profesores.update({
                where: { profesor_id: id },
                data: {
                    ...dataWithoutMaxHora,
                    ...(data.nombre || data.apellidos ? {
                        email: data.email?.trim() || buildFallbackEmail(data.nombre ?? '', data.apellidos ?? ''),
                    } : {}),
                },
            });
        } catch (error: any) {
            if (error?.code === 'P2002') {
                throw new BadRequestException('Ya existe un profesor con ese correo');
            }
            throw error;
        }

        if (max_hora !== undefined && await this.hasMaxHoraColumn()) {
            await this.prisma.$executeRaw`
                UPDATE profesores
                SET max_hora = ${max_hora}
                WHERE profesor_id = ${id}::uuid
            `;

            return this.prisma.profesores.findUnique({
                where: { profesor_id: id },
            });
        }

        return updated;
    }

    async delete(id: string) {
        return this.prisma.profesores.delete({
            where: { profesor_id: id },
        });
    }
}

