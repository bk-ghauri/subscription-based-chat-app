import { Module } from '@nestjs/common';
import { ConversationMembersService } from './conversation-members.service';
import { ConversationMembersController } from './conversation-members.controller';

@Module({
  controllers: [ConversationMembersController],
  providers: [ConversationMembersService],
})
export class ConversationMembersModule {}
