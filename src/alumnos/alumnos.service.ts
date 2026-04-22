import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AlumnosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.alumnos.findMany({
      include: { grupo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.alumnos.findUnique({
      where: { id },
      include: { grupo: true },
    });
  }

  private async validateGroupCapacity(grupo_id?: string, alumnoIdToExclude?: string) {
    if (!grupo_id) return;

    const grupo = await this.prisma.grupos.findUnique({ where: { id: grupo_id } });
    if (!grupo) {
      throw new BadRequestException('El grupo seleccionado no existe');
    }

    const inscritos = await this.prisma.alumnos.count({
      where: {
        grupo_id,
        ...(alumnoIdToExclude ? { id: { not: alumnoIdToExclude } } : {}),
      },
    });

    if (inscritos >= grupo.limite_alumnos) {
      throw new BadRequestException('El grupo ya alcanzó su límite de alumnos');
    }
  }

  async create(data: {
    nombre: string;
    direccion?: string;
    telefono_contacto?: string;
    email_contacto?: string;
    grupo_id?: string;
  }) {
    await this.validateGroupCapacity(data.grupo_id);

    const { grupo_id, ...payload } = data;

    try {
      return await this.prisma.alumnos.create({
        data: {
          ...payload,
          ...(grupo_id ? { grupo_id } : {}),
        },
        include: { grupo: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException('Ya existe un alumno con esos datos');
      }
      throw error;
    }
  }

  async update(
    id: string,
    data: Partial<{
      nombre: string;
      direccion?: string;
      telefono_contacto?: string;
      email_contacto?: string;
      grupo_id?: string;
    }>,
  ) {
    if (data.grupo_id !== undefined) {
      await this.validateGroupCapacity(data.grupo_id, id);
    }

    const { grupo_id, ...payload } = data;

    try {
      return await this.prisma.alumnos.update({
        where: { id },
        data: {
          ...payload,
          ...(grupo_id !== undefined ? { grupo_id } : {}),
        },
        include: { grupo: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException('Ya existe un alumno con esos datos');
      }
      throw error;
    }
  }

  async delete(id: string) {
    return this.prisma.alumnos.delete({ where: { id } });
  }
}
