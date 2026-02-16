import { Controller } from '@nestjs/common';
import { PsicologosService } from './psicologos.service';
import { Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';

import { Prisma,  } from '@prisma/client';


@Controller('psicologos')
export class PsicologosController {
      constructor(private readonly psicologosService: PsicologosService) {}

        @Get()
        async getAll() {
            return this.psicologosService.findAll();
        }
        @Get('/area/:area_id')
        async getByArea(@Param('area_id') area_id: number) {
            return this.psicologosService.findByArea(area_id);
        }

        @Get(':id')
        async getById(@Param('id') id: string) {
            return this.psicologosService.findOne(id);
        }

        @Post()
        async create(@Body() body: Prisma.psicologosCreateInput) {
            return this.psicologosService.create(body);
        }   


      

}
