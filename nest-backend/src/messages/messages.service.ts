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
import { ReturnMessageDto } from './dto/return-message.dto';
import { MessageSenderDto } from './dto/message-sender.dto';
import { MessageAttachmentDto } from '@app/attachments/dto/message-attachment.dto';
import { MessageStatusDto } from '@app/message-status/dto/message-status.dto';
import { AttachmentsService } from '@app/attachments/attachments.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,

    private readonly userService: UsersService,
    private readonly conversationsService: ConversationsService,
    private readonly attachmentService: AttachmentsService,
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

    // Link attachment if provided

    if (dto.attachmentId) {
      const attachment = await this.attachmentService.findOneWithoutMessage(
        dto.attachmentId,
      );

      if (!attachment) {
        throw new BadRequestException('Attachment not found or already linked');
      }

      attachment.message = saved;
      await this.attachmentService.saveWithMessage(attachment);

      saved.attachment = attachment;
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
      relations: ['sender', 'attachment', 'conversation', 'statuses'],
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

    const attachment: MessageAttachmentDto | null = msg.attachment
      ? { id: msg.attachment.id, url: msg.attachment.fileUrl }
      : null;

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
      attachment,
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
