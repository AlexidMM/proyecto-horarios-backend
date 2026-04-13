import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { SalonesService } from './salones.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorador';

@Controller('salones')
@UseGuards(AuthGuard('jwt'), RolesGuard) // Protege todo el controlador
export class SalonesController {
  constructor(private readonly salonesService: SalonesService) {}

  @Get()
  @Roles('administrador') // Solo admins
  async getAll() {
    return this.salonesService.findAll();
  }

  @Get(':id')
  // @Roles('administrador')
  async getById(@Param('id') id: string) {
    return this.salonesService.findById(id);
  }

  @Post()
  // @Roles('administrador')
  async create(@Body() body: { nombre: string; data: object; division: string }) {
    const exists = await this.salonesService.findByNombreYEdificio(body.nombre);
    if (exists) {
      return { error: 'Ya existe un salón con ese nombre.' };
    }
    return this.salonesService.create(body);
  }

  @Patch(':id')
  // @Roles('administrador')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{ nombre: string; data: object; division: string }>,
  ) {
    return this.salonesService.update(id, body);
  }

  @Delete(':id')
  // @Roles('administrador')
  async delete(@Param('id') id: string) {
    return this.salonesService.delete(id);
  }
}
