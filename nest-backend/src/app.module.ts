import { Module } from '@nestjs/common';
import { AppController } from '@app/app.controller';
import { AppService } from '@app/app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '@app/users/users.module';
import { AuthModule } from './auth/auth.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AccountType } from './typeorm/entities/AccountType';
import { Suspended } from './typeorm/entities/Suspended';
import { Conversation } from '@app/conversations/entities/conversation.entity';
import { ConversationMember } from '@app/conversation-members/entities/conversation-member.entity';
import { Attachment } from './typeorm/entities/Attachment';
import { Subscription } from './typeorm/entities/Subscription';
import { User } from './users/entities/User';
import { ConfigModule } from '@nestjs/config';
import { MessagesModule } from './messages/messages.module';
import { ConversationsModule } from './conversations/conversations.module';
import { ConversationMembersModule } from './conversation-members/conversation-members.module';
import jwtConfig from './auth/config/jwt.config';
import { Message } from './messages/entities/message.entity';

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
      ],
      synchronize: false,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
