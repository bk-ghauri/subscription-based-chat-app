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
import { UpdateMessageDto } from './dto/update-message.dto';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@app/users/users.service';
import { ConversationsService } from '@app/conversations/conversations.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class MessagesGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;
  constructor(
    private readonly messagesService: MessagesService,
    private jwtService: JwtService,
    private userService: UserService,
    private conversationsService: ConversationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token; // or client.handshake.headers.authorization
      const payload = this.jwtService.verify(token);

      // Fetch user from DB using user_id
      const user = await this.userService.findOne(payload.sub);

      if (!user) {
        client.disconnect();
        return { success: false, message: 'Unauthorized' };
      }

      (client as any).user = {
        id: user.user_id,
        displayName: user.display_name,
      };

      console.log(`${user.display_name} connected`);
    } catch (err) {
      console.error('Invalid client connection:', err.message);
      client.disconnect();
    }
  }
  @SubscribeMessage('createMessage')
  async create(
    @MessageBody() dto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = (client as any).user;

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
    console.log(
      `👤 ${user.display_name} joined conversation ${data.conversationId}`,
    );

    return { success: true, room: data.conversationId };
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

  @SubscribeMessage('findAllMessages')
  findAll() {
    return this.messagesService.findAll();
  }

  @SubscribeMessage('removeMessage')
  remove(@MessageBody() id: number) {
    return this.messagesService.remove(id);
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
