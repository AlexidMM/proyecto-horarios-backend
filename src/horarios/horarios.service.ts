
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';


@Injectable()
export class HorariosService {
    constructor(private prisma: PrismaService) {}

    async findAll() {
        return this.prisma.horarios.findMany();
    }
        async compareHorario(id: string, newData: { nombregrupo?: string; data?: object }) {
        const horario = await this.findById(id);
        if (!horario) {
            return { error: 'Horario no encontrado' };
        }
        const cambios: any = {};
        if (newData.nombregrupo !== undefined && newData.nombregrupo !== horario.nombregrupo) {
            cambios.nombregrupo = newData.nombregrupo;
        }
        if (newData.data !== undefined && JSON.stringify(newData.data) !== JSON.stringify(horario.data)) {
            cambios.data = newData.data;
        }
        if (Object.keys(cambios).length > 0) {
            return { message: 'Horario modificado', cambios };
        } else {
            return { message: 'No hay cambios en el horario' };
        }
    }

    async findById(id: string) {
        return this.prisma.horarios.findUnique({
            where: { id },
        });
    }

    async create(data: {
        nombregrupo: string;
        data: object;
    }) {
        return this.prisma.horarios.create({
            data,
        });
    }

    async update(id: string, data: Partial<{
        nombregrupo: string;
        data: object;
    }>) {
        return this.prisma.horarios.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        return this.prisma.horarios.delete({
            where: { id },
        });
    }
}

