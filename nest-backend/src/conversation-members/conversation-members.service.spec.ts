import { Test, TestingModule } from '@nestjs/testing';
import { ConversationMembersService } from './conversation-members.service';

describe('ConversationMembersService', () => {
  let service: ConversationMembersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConversationMembersService],
    }).compile();

    service = module.get<ConversationMembersService>(ConversationMembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
