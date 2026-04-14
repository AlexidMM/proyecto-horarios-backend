import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { GruposService } from './grupos.service';

@Controller('grupos')
export class GruposController {
  constructor(private readonly gruposService: GruposService) {}
  
  @Get()
  async getAll() {
    return this.gruposService.findAll();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.gruposService.findById(id);
  }

  @Post()
  async create(@Body() body: { nombre: string; division?: string; data?: object; grado: number, carrera?: string}) {
    return this.gruposService.create(body);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{ nombre: string; division?: string; data?: object; grado: number, carrera?: string }>
  ) {
    return this.gruposService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.gruposService.delete(id);
  }
}
