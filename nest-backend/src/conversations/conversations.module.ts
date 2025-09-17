import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { ConversationMember } from '@app/conversation-members/entities/conversation-member.entity';
import { Conversation } from './entities/conversation.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@app/users/entities/user.entity';
import { AccountType } from '@app/account-types/entities/account-type.entity';
import { ConversationMembersService } from '@app/conversation-members/conversation-members.service';
import { UsersService } from '@app/users/users.service';
import { AccountTypesModule } from '@app/account-types/account-types.module';
import { ConversationMembersModule } from '@app/conversation-members/conversation-members.module';
import { UsersModule } from '@app/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation]),
    AccountTypesModule,
    ConversationMembersModule,
    UsersModule,
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
