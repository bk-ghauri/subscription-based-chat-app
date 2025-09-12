import { Module } from '@nestjs/common';
import { MessageStatusService } from './message-status.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageStatus } from './entities/message-status.entity';
import { MessagesService } from '@app/messages/messages.service';
import { Message } from '@app/messages/entities/message.entity';
import { UserService } from '@app/users/users.service';
import { ConversationsService } from '@app/conversations/conversations.service';
import { User } from '@app/users/entities/user.entity';
import { AccountType } from '@app/account-type/entities/account-type.entity';
import { Conversation } from '@app/conversations/entities/conversation.entity';
import { ConversationMembersService } from '@app/conversation-members/conversation-members.service';
import { ConversationMember } from '@app/conversation-members/entities/conversation-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MessageStatus,
      Message,
      User,
      AccountType,
      Conversation,
      ConversationMember,
    ]),
  ],
  providers: [
    MessageStatusService,
    MessagesService,
    UserService,
    ConversationsService,
    ConversationMembersService,
  ],
})
export class MessageStatusModule {}
