import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Server, Socket } from 'socket.io';
//import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@app/users/users.service';
import { ConversationsService } from '@app/conversations/conversations.service';
import { Inject, Logger } from '@nestjs/common';
import jwtConfig from '@app/auth/config/jwt.config';
import * as config from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { MessageStatusService } from '@app/message-status/message-status.service';
import { MessageStatusEnum } from '@app/message-status/types/message-status.enum';
import { ConversationTypeEnum } from '@app/conversations/types/conversation.enum';
import { ErrorMessages } from '@app/common/constants/error-messages';
import { TokenService } from '@app/auth/token.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private onlineUsers = new Map<string, Set<string>>(); // userId -> socketIds

  constructor(
    private readonly messagesService: MessagesService,
    private readonly userService: UsersService,
    private readonly conversationsService: ConversationsService,
    private readonly messageService: MessagesService,
    private readonly messageStatusService: MessageStatusService,
    private readonly tokenService: TokenService,
  ) {}

  async handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.split(' ')[1];

    try {
      const userId = await this.tokenService.verifyAccessToken(token);
      const user = await this.userService.findOne(userId);

      if (!user) {
        client.disconnect();
        return { success: false, message: ErrorMessages.unauthorized };
      }

      (client as any).user = {
        id: user.id,
        displayName: user.displayName,
      };

      //Presence tracking
      const socketId = client.id;

      if (!this.onlineUsers.has(user.id)) {
        this.onlineUsers.set(user.id, new Set());
        this.server.emit('userOnline', { userId: user.id });
      }

      this.onlineUsers.get(user.id)!.add(socketId);

      this.logger.log(`${user.displayName} connected`);

      client.emit('authenticated', { success: true });
    } catch (err) {
      this.logger.error(ErrorMessages.invalidConnectionError, err.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = (client as any).user;
    if (!user) return;

    const socketId = client.id;
    const userSockets = this.onlineUsers.get(user.id);

    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.onlineUsers.delete(user.id);
        this.server.emit('userOffline', { userId: user.id });
        this.logger.log(`${user.displayName} disconnected (offline)`);
      } else {
        this.logger.log(
          `${user.displayName} disconnected (still online in other tabs)`,
        );
      }
    }
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = (client as any).user;

    if (!user) {
      return { success: false, message: ErrorMessages.unauthorized };
    }

    //verify if user is part of the conversation
    const result = await this.conversationsService.validateMembership(
      user.id,
      data.conversationId,
    );

    if (!result.success) {
      return result;
    }

    client.join(data.conversationId);
    this.logger.log(
      `👤 ${user.displayName} joined conversation ${data.conversationId}`,
    );

    return { success: true, room: data.conversationId };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() dto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = (client as any).user;
    if (!user) {
      return { success: false, message: ErrorMessages.unauthorized };
    }

    const message = await this.messagesService.create({
      ...dto,
      senderId: user.id,
    });

    // Emit to recipients via receiveMessage
    this.server.in(dto.conversationId).emit('receiveMessage', message);

    return { success: true, message };
  }

  @SubscribeMessage('typing')
  async typing(
    @MessageBody() body: { conversationId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const user = (client as any).user;

    if (!user) return;

    client.to(body.conversationId).emit('typing', {
      displayName: user.displayName,
      isTyping: body.isTyping,
    });
  }

  @SubscribeMessage('messageDelivered')
  async handleDelivered(
    @MessageBody() body: { messageId: string; conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = (client as any).user;
    if (!user) return;

    const status = MessageStatusEnum.DELIVERED;

    await this.messageStatusService.updateStatus(
      body.messageId,
      user.id,
      status,
    );

    this.server.in(body.conversationId).emit('messageStatusUpdate', {
      messageId: body.messageId,
      userId: user.id,
      status: 'delivered',
    });
  }

  @SubscribeMessage('messageRead')
  async handleRead(
    @MessageBody() body: { messageId: string; conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = (client as any).user;
    if (!user) return;

    const status = MessageStatusEnum.READ;

    await this.messageStatusService.updateStatus(
      body.messageId,
      user.id,
      status,
    );

    this.server.in(body.conversationId).emit('messageStatusUpdate', {
      messageId: body.messageId,
      userId: user.id,
      status: 'read',
    });

    // Optionally emit ReadByAll update

    const message = await this.messageService.findByIdWithConversation(
      body.messageId,
    );
    if (message) {
      if (
        message.conversation.type === ConversationTypeEnum.GROUP &&
        message.readByAll
      ) {
        this.server.in(body.conversationId).emit('messageReadByAll', {
          messageId: body.messageId,
        });
      }
    }
  }

  @SubscribeMessage('removeMessage')
  async handleRemoveMessage(
    @MessageBody() data: { messageId: string; conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.messageService.remove(data.messageId);

    this.server.in(data.conversationId).emit('messageDeleted', {
      messageId: data.messageId,
    });
  }
}
