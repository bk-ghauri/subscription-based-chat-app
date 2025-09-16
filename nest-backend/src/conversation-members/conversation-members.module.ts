import { Module } from '@nestjs/common';
import { ConversationMembersService } from './conversation-members.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationMember } from './entities/conversation-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConversationMember])],
  providers: [ConversationMembersService],
  exports: [ConversationMembersService],
})
export class ConversationMembersModule {}
