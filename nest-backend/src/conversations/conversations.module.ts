import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { Conversation } from './entities/conversation.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountTypesModule } from '@app/account-types/account-types.module';
import { ConversationMembersModule } from '@app/conversation-members/conversation-members.module';
import { UsersModule } from '@app/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation]),
    ConversationMembersModule,
    UsersModule,
    AccountTypesModule,
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
