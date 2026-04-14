import { Module } from '@nestjs/common';
import { HorariosService } from './horarios.service';
import { HorariosController } from './horarios.controller';
import { PythonModule } from '../python/python.module';


@Module({
  controllers: [HorariosController],
  imports: [PythonModule],
  providers: [HorariosService],
})
export class HorariosModule {}
