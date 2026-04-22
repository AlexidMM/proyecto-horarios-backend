import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AlumnosService } from './alumnos.service';

@Controller('alumnos')
export class AlumnosController {
  constructor(private readonly alumnosService: AlumnosService) {}

  @Get()
  async getAll() {
    return this.alumnosService.findAll();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.alumnosService.findById(id);
  }

  @Post()
  async create(
    @Body()
    body: {
      nombre: string;
      direccion?: string;
      telefono_contacto?: string;
      email_contacto?: string;
      grupo_id?: string;
    },
  ) {
    return this.alumnosService.create(body);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      nombre: string;
      direccion?: string;
      telefono_contacto?: string;
      email_contacto?: string;
      grupo_id?: string;
    }>,
  ) {
    return this.alumnosService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.alumnosService.delete(id);
  }
}
