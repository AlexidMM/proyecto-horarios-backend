import { Injectable } from '@nestjs/common';
import { Prisma  } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class PsicologosService {
    constructor(private prisma: PrismaService) {}

    async findAll() {
        return this.prisma.psicologos.findMany({
        
        });
    }

    async findByArea(area_id: number) {
        return this.prisma.psicologos.findMany({
            where: { area_id }
        });
    }

    async findOne(id: string) {
        return this.prisma.psicologos.findUnique({
           where: { psicologo_id: id }
        });
    }


    async create(data: Prisma.psicologosCreateInput) {
        return this.prisma.psicologos.create({
            data,
        });
    }


}
