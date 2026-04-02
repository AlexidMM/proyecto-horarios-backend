import { Controller } from '@nestjs/common';
import { IntegracionService } from './integracion.service';

@Controller('integracion')
export class IntegracionController {
  constructor(private readonly integracionService: IntegracionService) {}
}
