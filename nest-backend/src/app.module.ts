import { Module } from '@nestjs/common';
import { AppController } from '@app/app.controller';
import { AppService } from '@app/app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '@app/users/users.module';
import { AuthModule } from './auth/auth.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AccountType } from '@app/account-types/entities/account-type.entity';
import { Suspended } from './suspended/entities/suspended.entity';
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
import { AccountTypesModule } from './account-types/account-types.module';
import { MessageStatus } from './message-status/entities/message-status.entity';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { MessageAttachmentsModule } from './message-attachments/message-attachments.module';
import { MessageAttachment } from './message-attachments/entities/message-attachment.entity';
import { AdminModule } from './admin/admin.module';
import { SuspendedModule } from './suspended/suspended.module';

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
        MessageAttachment,
      ],
      namingStrategy: new SnakeNamingStrategy(),
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
    AccountTypesModule,
    MessageAttachmentsModule,
    AdminModule,
    SuspendedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
