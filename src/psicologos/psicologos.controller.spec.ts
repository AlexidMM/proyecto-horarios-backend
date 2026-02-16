import { Test, TestingModule } from '@nestjs/testing';
import { PsicologosController } from './psicologos.controller';

describe('PsicologosController', () => {
  let controller: PsicologosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PsicologosController],
    }).compile();

    controller = module.get<PsicologosController>(PsicologosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
