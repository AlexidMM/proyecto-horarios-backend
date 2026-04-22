import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from '../prisma/prisma.model';
import { GruposModule } from './grupos/grupos.module';
import { ProfesoresModule } from './profesores/profesores.module';
import { SalonesModule } from './salones/salones.module';
import { HorariosModule } from './horarios/horarios.module';
import { AuthModule } from './auth/auth.module';
import { MateriasModule } from './materias/materias.module';
import { PythonModule } from './python/python.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { IntegracionModule } from './integracion/integracion.module';
import { AlumnosModule } from './alumnos/alumnos.module';
import { EdificiosModule } from './edificios/edificios.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      
    }),
PrismaModule,
    DatabaseModule,

    UsersModule,

    GruposModule,

    ProfesoresModule,

    SalonesModule,

    HorariosModule,

    AuthModule,

    MateriasModule,
    AlumnosModule,
    EdificiosModule,
    PythonModule,
    SchedulerModule,
    IntegracionModule,
  ],
  
})
export class AppModule {}
