import { Controller } from '@nestjs/common';
import { ProfesoresService } from './profesores.service';
import { Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/roles/roles.guard';


  
// @UseGuards(RolesGuard)
@Controller('profesores')
export class ProfesoresController {
  constructor(private readonly profesoresService: ProfesoresService) {}

  @Get()
  async getAll() {
    return this.profesoresService.findAll();
  }
  
  @Get('/movil')
  async getAllMovil() {
    return this.profesoresService.findAllMovil();
  }
  
  @Get('/tutores')
  async getAllTutors() {
    return this.profesoresService.findAllTutors();
  }

  @Get(':id')
  async getById(@Param('id') profesor_id: string) {
    return this.profesoresService.findById(profesor_id);
  }


  @Post()
  async create(@Body() body: {
    nombre: string;
    apellidos: string;
    materias?: object;
    metadata?: object;
    min_hora?: number;
    max_hora?: number;
  }) {
    return this.profesoresService.create(body);
  }

  @Patch(':id')
  async update(
    @Param('id') profesor_id: string,
    @Body() body: Partial<{
      nombre: string;
      apellidos: string;
      materias?: object;
      metadata?: object;
      min_hora: number;
      max_hora: number;
    }>
  ) {
    return this.profesoresService.update(profesor_id, body);
  }

  @Delete(':id')
  async delete(@Param('id') profesor_id: string) {
    return this.profesoresService.delete(profesor_id);
  }
}
