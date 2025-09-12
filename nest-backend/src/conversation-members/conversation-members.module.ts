import { Module } from '@nestjs/common';
import { ConversationMembersService } from './conversation-members.service';
import { ConversationMembersController } from './conversation-members.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationMember } from './entities/conversation-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConversationMember])],
  controllers: [ConversationMembersController],
  providers: [ConversationMembersService],
})
export class ConversationMembersModule {}
