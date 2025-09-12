import { Module } from '@nestjs/common';
import { AppController } from '@app/app.controller';
import { AppService } from '@app/app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '@app/users/users.module';
import { AuthModule } from './auth/auth.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AccountType } from '@app/account-type/entities/account-type.entity';
import { Suspended } from './common/entities/suspended.entity';
import { Conversation } from '@app/conversations/entities/conversation.entity';
import { ConversationMember } from '@app/conversation-members/entities/conversation-member.entity';
import { Attachment } from './attachments/entities/attachment.entity';
import { Subscription } from './subscriptions/entities/subscription.entity';
import { User } from './users/entities/user.entity';
import { ConfigModule } from '@nestjs/config';
import { MessagesModule } from './messages/messages.module';
import { ConversationsModule } from './conversations/conversations.module';
import { ConversationMembersModule } from './conversation-members/conversation-members.module';
import jwtConfig from './auth/config/jwt.config';
import { Message } from './messages/entities/message.entity';
import { MessageStatusModule } from './message-status/message-status.module';
import { AccountTypeModule } from './account-type/account-type.module';
import { MessageStatus } from './message-status/entities/message-status.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'barira123',
      database: 'chat_app',
      entities: [
        User,
        AccountType,
        Suspended,
        Conversation,
        ConversationMember,
        Attachment,
        Subscription,
        Message,
        MessageStatus,
      ],
      synchronize: false,
      dropSchema: false,
    }),
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule available in every module
      envFilePath: '.env',
      load: [jwtConfig],
    }),
    UsersModule,
    AuthModule,
    AttachmentsModule,
    SubscriptionsModule,
    MessagesModule,
    ConversationsModule,
    ConversationMembersModule,
    MessageStatusModule,
    AccountTypeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
