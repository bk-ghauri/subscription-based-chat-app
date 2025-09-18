import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './entities/message.entity';
import { Repository } from 'typeorm';
import { UsersService } from '@app/users/users.service';
import { ConversationsService } from '@app/conversations/conversations.service';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageResponseObject } from './responses/message-response';
import { MessageSenderResponse } from './responses/message-sender-response';
import { MessageAttachmentResponse } from '@app/attachments/responses/message-attachment-response';
import { MessageStatusResponse } from '@app/message-status/responses/message-status-response';
import { ErrorMessages } from '@app/common/constants/error-messages';
import { SuccessMessages } from '@app/common/constants/success-messages';

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

    if (!conversation)
      throw new NotFoundException(ErrorMessages.conversationNotFound);

    const sender = await this.userService.findOne(dto.senderId);

    if (!sender) throw new NotFoundException(ErrorMessages.senderNotFound);

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
      relations: {
        sender: true,
        attachments: true,
        conversation: true,
        statuses: true,
      },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit, //offset
      take: limit,
      withDeleted: false, // Exclude soft-deleted messages (optional param, false by default)
    });

    return messages.map((msg) => this.toMessageResponse(msg));
  }
  // Helper to transform Message entity to safe DTO
  private toMessageResponse(msg: Message): MessageResponseObject {
    const sender: MessageSenderResponse = {
      id: msg.sender.id,
      displayName: msg.sender.displayName,
      avatar: msg.sender.avatarUrl,
    };

    const attachments: MessageAttachmentResponse[] =
      msg.attachments?.map((a) => ({
        id: a.id,
        url: a.fileUrl,
      })) || [];

    const statuses: MessageStatusResponse[] =
      msg.statuses?.map((s) => ({
        receiverId: s.receiverId,
        status: s.status,
        deliveredAt: s.deliveredAt,
        readAt: s.readAt,
      })) || [];

    const response: MessageResponseObject = {
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
      throw new NotFoundException(ErrorMessages.messageNotFound);
    }
  }

  async findByIdWithConversation(messageId: string) {
    return this.messageRepository.findOne({
      where: { id: messageId },
      relations: { conversation: true },
    });
  }

  async remove(id: string) {
    const result = await this.messageRepository.softDelete(id);

    if (!result.affected) {
      throw new NotFoundException(ErrorMessages.messageNotFound);
    }
    return { success: true, message: SuccessMessages.messageDeleted };
  }
}
