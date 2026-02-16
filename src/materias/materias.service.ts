import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
const uuidModulePromise = import('uuid');
import * as crypto from 'crypto';

@Injectable()
export class MateriasService {
    constructor(private prisma: PrismaService) {}

    async findAll() {
        return this.prisma.materias.findMany();
    }

    async findByArea(areaId: number) {
    return this.prisma.materias.findMany({
      where: { area_id: areaId },
    });
  }
    
    async getHash() {
    const materias = await this.prisma.materias.findMany({
      select: { id: true, updated_at: true },
      orderBy: { updated_at: 'desc' },
    });

    // Crea un hash basado en los datos (sirve para detectar cambios)
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(materias))
      .digest('hex');

    return { hash };
  }
    async findById(id: string) {
    const { validate: isUUID } = await uuidModulePromise;
    if (!isUUID(id)) {
      throw new BadRequestException('El id proporcionado no es un UUID válido');
    }

    return this.prisma.materias.findUnique({
      where: { id },
    });
  }
    async create(data: {
        nombre: string;
        carrera: string;
        data?: object;
        horas_semana: number;
        grado: number;
        salones?: object;
    }) {
        return this.prisma.materias.create({    
            data,
        });
    }

    async update(id: string, data: Partial<{
        nombre: string;
        carrera: string;
        data?: object;
        grado: number;
        horas_semana: number;
    }>) {
        return this.prisma.materias.update({
            where: { id },
            data,
        });
    }
    async delete(id: string) {
        return this.prisma.materias.delete({
            where: { id },
        });
    }


}
