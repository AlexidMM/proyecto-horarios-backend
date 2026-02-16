import { Module } from '@nestjs/common';
import { PsicologosService } from './psicologos.service';
import { PsicologosController } from './psicologos.controller';

@Module({
  providers: [PsicologosService],
  controllers: [PsicologosController]
})
export class PsicologosModule {}
