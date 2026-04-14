import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PythonService {
  private readonly pythonUrl = 'http://localhost:5000';

  constructor(private readonly httpService: HttpService, private readonly prismaService: PrismaService) {}

  async runScript() {
    try {
    const response = await firstValueFrom(
  this.httpService.post(
    `${this.pythonUrl}/generar-horario`,
    {}, // enviar un body vacío JSON
    { headers: { 'Content-Type': 'application/json' } }
  )
);


      return response.data;
    } catch (error) {
      throw new Error(`Error al ejecutar script Python: ${error.message}`);
    }
  }

  async create(data: { nombregrupo: string; data: any }) {
  return this.prismaService.horarios.create({
    data: {
      nombregrupo: data.nombregrupo,
      data: data.data, // 👈 este campo coincide con tu modelo
    },
  });
}
}

