import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Server, Socket } from 'socket.io';
//import { JwtService } from '@nestjs/jwt';
import { UserService } from '@app/users/users.service';
import { ConversationsService } from '@app/conversations/conversations.service';
import { Inject, Logger } from '@nestjs/common';
import jwtConfig from '@app/auth/config/jwt.config';
import * as config from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({ cors: { origin: '*' } })
export class MessagesGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: config.ConfigType<typeof jwtConfig>,
    private readonly messagesService: MessagesService,
    //private jwtService: JwtService,
    private userService: UserService,
    private conversationsService: ConversationsService,
    private messageService: MessagesService,
    private readonly logger = new Logger(MessagesGateway.name),
  ) {}

  async handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.split(' ')[1];

    if (!this.jwtConfiguration.secret) {
      throw new Error('JWT secret is not configured');
    }

    // Fetch user from DB using user_id
    try {
      //const payload = this.jwtService.verify(token);

      const payload: any = jwt.verify(token, this.jwtConfiguration.secret); // <-- use secret directly since injecting JwtService was causing issues
      const user = await this.userService.findOne(payload.sub);

      if (!user) {
        client.disconnect();
        return { success: false, message: 'Unauthorized' };
      }

      // client.data.user = {
      //   id: user.user_id,
      //   displayName: user.display_name,
      // };

      (client as any).user = {
        id: user.user_id,
        displayName: user.display_name,
      };

      this.logger.log(`${user.display_name} connected`);
      client.emit('authenticated', { success: true });
    } catch (err) {
      this.logger.error('Invalid client connection:', err.message);
      client.disconnect();
    }
  }
  @SubscribeMessage('createMessage')
  async create(
    @MessageBody() dto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    //const user = client.data.user;

    const user = (client as any).user;

    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    const message = await this.messagesService.create({
      ...dto,
      senderId: user.id,
    });
    this.server.in(dto.conversationId).emit('message', message);
    return message;
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    //const user = client.data.user;
    const user = (client as any).user;

    if (!user) {
      return { success: false, message: 'Unauthorized' };
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

  @SubscribeMessage('typing')
  async typing(
    @MessageBody() body: { conversationId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    //const user = client.data.user;
    const user = (client as any).user;

    if (!user) return;

    client.to(body.conversationId).emit('typing', {
      displayName: user.displayName,
      isTyping: body.isTyping,
    });
  }

  @SubscribeMessage('findAllMessages')
  findAll() {
    return this.messagesService.findAll();
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

  // @SubscribeMessage('findOneMessage')
  // findOne(@MessageBody() id: number) {
  //   return this.messagesService.findOne(id);
  // }

  // @SubscribeMessage('updateMessage')
  // update(@MessageBody() updateMessageDto: UpdateMessageDto) {
  //   return this.messagesService.update(updateMessageDto.id, updateMessageDto);
  // }
}
