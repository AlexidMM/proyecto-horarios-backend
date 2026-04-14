import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
const uuidModulePromise = import('uuid');
import * as crypto from 'crypto';

@Injectable()
export class MateriasService {
    constructor(private prisma: PrismaService) {}

  private normalizeSalones(salones: unknown) {
    if (Array.isArray(salones)) {
      return salones;
    }
    if (typeof salones === 'string' && salones.trim().length > 0) {
      return [salones.trim()];
    }
    return [];
  }

    async findAll() {
        return this.prisma.materias.findMany();
    }

    async findByArea(areaId: number) {
    return this.prisma.materias.findMany({
      where: {
        OR: [
          { area_id: areaId },
          { area_id: null },
        ],
      },
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
      carrera?: string;
        data?: object;
        horas_semana: number;
        grado: number;
        salones?: object;
      area_id?: number;
    }) {
        return this.prisma.materias.create({    
        data: {
          ...data,
          carrera: data.carrera?.trim() || 'General',
          data: data.data ?? { tipo: 'teorica' },
          salones: this.normalizeSalones(data.salones),
          area_id: data.area_id,
        },
        });
    }

    async update(id: string, data: Partial<{
        nombre: string;
      carrera: string;
        data?: object;
        grado: number;
        horas_semana: number;
      salones?: object;
    }>) {
        return this.prisma.materias.update({
            where: { id },
        data: {
          ...data,
          ...(data.carrera !== undefined ? { carrera: data.carrera || 'General' } : {}),
          ...(data.data !== undefined ? { data: data.data ?? { tipo: 'teorica' } } : {}),
          ...(data.salones !== undefined ? { salones: this.normalizeSalones(data.salones) } : {}),
        },
        });
    }
    async delete(id: string) {
        return this.prisma.materias.delete({
            where: { id },
        });
    }


}

