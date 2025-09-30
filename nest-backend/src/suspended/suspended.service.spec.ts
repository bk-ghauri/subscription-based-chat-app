import { Test, TestingModule } from '@nestjs/testing';
import { SuspendedService } from './suspended.service';

describe('SuspendedService', () => {
  let service: SuspendedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SuspendedService],
    }).compile();

    service = module.get<SuspendedService>(SuspendedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
