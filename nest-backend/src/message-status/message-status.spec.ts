import { Test, TestingModule } from '@nestjs/testing';
import { MessageStatus } from './message-status.service';

describe('MessageStatus', () => {
  let provider: MessageStatus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessageStatus],
    }).compile();

    provider = module.get<MessageStatus>(MessageStatus);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
