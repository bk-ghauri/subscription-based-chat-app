import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './entities/message.entity';
import { Repository } from 'typeorm';
import { UsersService } from '@app/users/users.service';
import { ConversationsService } from '@app/conversations/conversations.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ReturnMessageDto } from './dto/return-message.dto';
import { MessageSenderDto } from './dto/message-sender.dto';
import { MessageAttachmentDto } from '@app/attachments/dto/message-attachment.dto';
import { MessageStatusDto } from '@app/message-status/dto/message-status.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,

    private readonly userService: UsersService,

    private readonly conversationsService: ConversationsService,
  ) {}

  async create(dto: CreateMessageDto) {
    const conversation = await this.conversationsService.findOne(
      dto.conversationId,
    );

    if (!conversation) throw new NotFoundException('Conversation not found');

    const sender = await this.userService.findOne(dto.senderId);

    if (!sender) throw new NotFoundException('Sender not found');

    const message = this.messageRepository.create({
      body: dto.body,
      conversation,
      sender,
    });

    const saved = await this.messageRepository.save(message);

    return this.toMessageResponse({
      ...saved,
      sender,
      conversation,
    } as Message);
  }

  async findMessagesByConversation(
    conversationId: string,
    page = 1,
    limit = 20,
  ) {
    const messages = await this.messageRepository.find({
      where: { conversation: { id: conversationId } },
      relations: ['sender', 'attachments', 'conversation', 'statuses'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit, //offset
      take: limit,
      withDeleted: false, // Exclude soft-deleted messages (optional param, false by default)
    });

    // Transform into safe DTOs to prevent leaking sensitive info to frontend
    return messages.map((msg) => this.toMessageResponse(msg));
  }
  // Helper to transform Message entity to safe DTO
  private toMessageResponse(msg: Message): ReturnMessageDto {
    const sender: MessageSenderDto = {
      id: msg.sender.id,
      displayName: msg.sender.displayName,
      avatar: msg.sender.avatarUrl,
    };

    const attachments: MessageAttachmentDto[] =
      msg.attachments?.map((a) => ({
        id: a.id,
        url: a.fileUrl,
      })) || [];

    const statuses: MessageStatusDto[] =
      msg.statuses?.map((s) => ({
        receiverId: s.receiverId,
        status: s.status,
        deliveredAt: s.deliveredAt,
        readAt: s.readAt,
      })) || [];

    const response: ReturnMessageDto = {
      id: msg.id,
      body: msg.body,
      createdAt: msg.createdAt,
      sender,
      attachments,
      statuses,
    };
    return response;
  }

  async markReadByAll(messageId: string) {
    const result = await this.messageRepository.update(messageId, {
      readByAll: true,
    });

    if (result.affected === 0) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }
  }

  async findByIdWithConversation(messageId: string) {
    return this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['conversation'],
    });
  }

  async remove(id: string) {
    const result = await this.messageRepository.softDelete(id);

    if (result.affected === 0) {
      throw new NotFoundException(
        `Message with ID ${id} not found or already deleted`,
      );
    }
    return `Message #${id} has been soft-deleted`;
  }
}
