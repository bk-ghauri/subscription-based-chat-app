import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './entities/message.entity';
import { Repository } from 'typeorm';
import { UsersService } from '@app/users/users.service';
import { ConversationsService } from '@app/conversations/conversations.service';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageResponse } from './responses/message-response';
import { MessageSenderResponse } from './responses/message-sender-response';
import { MessageAttachmentResponse } from '@app/attachments/responses/message-attachment-response';
import { MessageStatusResponse } from '@app/message-status/responses/message-status-response';
import { ErrorMessages } from '@app/common/strings/error-messages';
import { SuccessMessages } from '@app/common/strings/success-messages';
import { AttachmentsService } from '@app/attachments/attachments.service';
import { MessageAttachmentsService } from '@app/message-attachments/message-attachments.service';
import { MessageAttachment } from '@app/message-attachments/entities/message-attachment.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,

    private readonly userService: UsersService,
    private readonly conversationService: ConversationsService,
    private readonly attachmentService: AttachmentsService,
    private readonly messageAttachmentService: MessageAttachmentsService,
  ) {}

  async create(dto: CreateMessageDto) {
    const conversation = await this.conversationService.findOne(
      dto.conversationId,
    );

    if (!conversation)
      throw new NotFoundException(ErrorMessages.CONVERSATION_NOT_FOUND);

    const sender = await this.userService.findOne(dto.senderId);

    if (!sender) throw new NotFoundException(ErrorMessages.SENDER_NOT_FOUND);

    const message = this.messageRepository.create({
      body: dto.body,
      conversation,
      sender,
    });

    const saved = await this.messageRepository.save(message);

    // Link attachments (if any) through bridge table

    const uniqueAttachmentIds = [...new Set(dto.attachmentIds)]; //ensure no duplicate attachments

    if (dto.attachmentIds?.length) {
      const messageAttachments = await Promise.all(
        uniqueAttachmentIds.map(async (attachmentId) => {
          const attachment = await this.attachmentService.findOne(attachmentId);
          if (!attachment) {
            throw new BadRequestException(ErrorMessages.ATTACHMENT_NOT_FOUND);
          }

          return this.messageAttachmentService.create({
            messageId: saved.id,
            attachmentId: attachment.id,
          });
        }),
      );

      saved.attachmentLinks = messageAttachments;
    }

    return this.toMessageResponse({
      ...saved,
      sender,
      conversation,
    });
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
        attachmentLinks: { attachment: true },
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
  private toMessageResponse(msg: Message): MessageResponse {
    const sender: MessageSenderResponse = {
      id: msg.sender.id,
      displayName: msg.sender.displayName,
      avatarUrl: msg.sender.avatarUrl,
    };

    const attachments: MessageAttachmentResponse[] =
      msg.attachmentLinks?.map((link) => ({
        id: link.attachment.id,
        url: link.attachment.fileUrl,
      })) || [];

    const statuses: MessageStatusResponse[] =
      msg.statuses?.map((s) => ({
        receiverId: s.receiverId,
        status: s.status,
        deliveredAt: s.deliveredAt,
        readAt: s.readAt,
      })) || [];

    const response: MessageResponse = {
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
      throw new NotFoundException(ErrorMessages.MESSAGE_NOT_FOUND);
    }
  }

  async findByIdWithConversation(messageId: string) {
    return this.messageRepository.findOne({
      where: { id: messageId },
      relations: { conversation: true },
    });
  }

  async softDelete(id: string) {
    const result = await this.messageRepository.softDelete(id);

    if (!result.affected) {
      throw new NotFoundException(ErrorMessages.MESSAGE_NOT_FOUND);
    }

    // Clean up bridge table entries
    await this.messageAttachmentService.softDeleteByMessageId(id);

    return { success: true, message: SuccessMessages.MESSAGE_DELETED };
  }
}
