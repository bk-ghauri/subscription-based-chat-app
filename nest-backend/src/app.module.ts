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
import { Conversation } from './typeorm/entities/Conversation';
import { ConversationMember } from './typeorm/entities/ConversationMember';
import { RefreshToken } from './typeorm/entities/RefreshToken';
import { Attachment } from './typeorm/entities/Attachment';
import { Subscription } from './typeorm/entities/Subscription';
import { Message } from './typeorm/entities/Message';
import { User } from './typeorm/entities/User';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { UserController } from './user/user.controller';

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
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    AttachmentsModule,
    SubscriptionsModule,
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule available in every module
    }),
    PassportModule.register({ session: true }),
  ],
  controllers: [AppController, UserController],
  providers: [AppService],
})
export class AppModule {}
