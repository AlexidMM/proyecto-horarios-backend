import { Test, TestingModule } from '@nestjs/testing';
import { IntegracionController } from './integracion.controller';
import { IntegracionService } from './integracion.service';

describe('IntegracionController', () => {
  let controller: IntegracionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntegracionController],
      providers: [IntegracionService],
    }).compile();

    controller = module.get<IntegracionController>(IntegracionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
