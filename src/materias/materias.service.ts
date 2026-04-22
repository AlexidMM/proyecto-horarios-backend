import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
const uuidModulePromise = import('uuid');
import * as crypto from 'crypto';

@Injectable()
export class MateriasService {
    constructor(private prisma: PrismaService) {}

  private normalizeGrade(grado: number) {
    const parsed = Number(grado);
    if (![1, 2, 3].includes(parsed)) {
      throw new BadRequestException('El grado debe ser 1, 2 o 3');
    }
    return parsed;
  }

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
        return this.prisma.materias.findMany({
          orderBy: [
            { grado: 'asc' },
            { nombre: 'asc' },
          ],
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
        data?: object;
        horas_semana: number;
        grado: number;
        salones?: object;
      permitir_doble_bloque?: boolean;
    }) {
        const grado = this.normalizeGrade(data.grado);

        try {
          return await this.prisma.materias.create({
            data: {
              ...data,
              grado,
              data: data.data ?? { tipo: 'teorica' },
              permitir_doble_bloque: Boolean(data.permitir_doble_bloque),
              salones: this.normalizeSalones(data.salones),
            },
          });
        } catch (error: any) {
          if (error?.code === 'P2002') {
            throw new BadRequestException('Ya existe una materia con ese nombre para ese grado');
          }
          throw error;
        }
    }

    async update(id: string, data: Partial<{
        nombre: string;
        data?: object;
        grado: number;
        horas_semana: number;
      salones?: object;
      permitir_doble_bloque?: boolean;
    }>) {
        const payload: any = {
          ...data,
          ...(data.grado !== undefined ? { grado: this.normalizeGrade(data.grado) } : {}),
          ...(data.data !== undefined ? { data: data.data ?? { tipo: 'teorica' } } : {}),
          ...(data.salones !== undefined ? { salones: this.normalizeSalones(data.salones) } : {}),
          ...(data.permitir_doble_bloque !== undefined ? { permitir_doble_bloque: Boolean(data.permitir_doble_bloque) } : {}),
        };

        try {
          return await this.prisma.materias.update({
            where: { id },
            data: payload,
          });
        } catch (error: any) {
          if (error?.code === 'P2002') {
            throw new BadRequestException('Ya existe una materia con ese nombre para ese grado');
          }
          throw error;
        }
    }
    async delete(id: string) {
        return this.prisma.materias.delete({
            where: { id },
        });
    }


}

