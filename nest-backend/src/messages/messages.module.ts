import { forwardRef, Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { MessagesController } from './messages.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { UsersService } from '@app/users/users.service';
import { ConversationsService } from '@app/conversations/conversations.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import jwtConfig from '@app/auth/config/jwt.config';
import { ConfigModule } from '@nestjs/config';
import { MessageStatusService } from '@app/message-status/message-status.service';
import { ConversationMembersService } from '@app/conversation-members/conversation-members.service';
import { UsersModule } from '@app/users/users.module';
import { ConversationsModule } from '@app/conversations/conversations.module';
import { AuthModule } from '@app/auth/auth.module';
import { MessageStatusModule } from '@app/message-status/message-status.module';
import { ConversationMembersModule } from '@app/conversation-members/conversation-members.module';

@Module({
  imports: [
    //AuthModule,
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    TypeOrmModule.forFeature([Message]),
    UsersModule,
    ConversationsModule,
    AuthModule,
    forwardRef(() => MessageStatusModule),
    ConversationMembersModule,
  ],
  providers: [MessagesGateway, MessagesService],
  controllers: [MessagesController],
  exports: [MessagesService],
})
export class MessagesModule {}
