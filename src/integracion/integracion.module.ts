import { Module } from '@nestjs/common';
import { IntegracionService } from './integracion.service';
import { IntegracionController } from './integracion.controller';

@Module({
  controllers: [IntegracionController],
  providers: [IntegracionService],
})
export class IntegracionModule {}
