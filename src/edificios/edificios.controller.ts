import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { EdificiosService } from './edificios.service';

@Controller('edificios')
export class EdificiosController {
  constructor(private readonly edificiosService: EdificiosService) {}

  @Get()
  async getAll() {
    return this.edificiosService.findAll();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.edificiosService.findById(id);
  }

  @Post()
  async create(@Body() body: { nombre: string; descripcion?: string }) {
    const exists = await this.edificiosService.findByName(body.nombre);
    if (exists) {
      return { error: 'Ya existe un edificio con ese nombre' };
    }
    try {
      return await this.edificiosService.create(body);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        return { error: 'Ya existe un edificio con ese nombre' };
      }
      throw error;
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{ nombre: string; descripcion?: string }>,
  ) {
    return this.edificiosService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.edificiosService.delete(id);
  }
}
