import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { MessagesController } from './messages.controller';
import { AuthModule } from '@app/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { User } from '@app/users/entities/User';
import { Attachment } from '@app/typeorm/entities/Attachment';
import { UserService } from '@app/users/users.service';
import { ConversationsService } from '@app/conversations/conversations.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Conversation } from '@app/conversations/entities/conversation.entity';
import { AccountType } from '@app/typeorm/entities/AccountType';
import { ConversationMember } from '@app/conversation-members/entities/conversation-member.entity';
import jwtConfig from '@app/auth/config/jwt.config';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  providers: [
    MessagesGateway,
    MessagesService,
    UserService,
    ConversationsService,
    JwtService,
  ],
  controllers: [MessagesController],
  imports: [
    //AuthModule,
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    TypeOrmModule.forFeature([
      Message,
      User,
      Attachment,
      Conversation,
      AccountType,
      ConversationMember,
    ]),
  ],
})
export class MessagesModule {}
