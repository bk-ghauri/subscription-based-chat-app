import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { ConversationMember } from '@app/conversation-members/entities/conversation-member.entity';
import { Conversation } from './entities/conversation.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@app/users/entities/user.entity';
import { AccountType } from '@app/account-type/entities/account-type.entity';
import { ConversationMembersService } from '@app/conversation-members/conversation-members.service';
import { UserService } from '@app/users/users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Conversation,
      ConversationMember,
      User,
      AccountType,
    ]),
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService, ConversationMembersService, UserService],
})
export class ConversationsModule {}
