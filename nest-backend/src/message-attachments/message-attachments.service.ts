import { Injectable, NotFoundException } from '@nestjs/common';
import { MessageAttachment } from './entities/message-attachment.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMessageAttachmentDto } from './dto/create-message-attachment.dto';
import { ErrorMessages } from '@app/common/strings/error-messages';
import { SuccessMessages } from '@app/common/strings/success-messages';

@Injectable()
export class MessageAttachmentsService {
  constructor(
    @InjectRepository(MessageAttachment)
    private messageAttachmentRepository: Repository<MessageAttachment>,
  ) {}

  async create(dto: CreateMessageAttachmentDto) {
    const messageAttachment = await this.messageAttachmentRepository.save(
      this.messageAttachmentRepository.create(dto),
    );
    return await this.findOne(
      messageAttachment.messageId,
      messageAttachment.attachmentId,
    );
  }

  async findOne(messageId: string, attachmentId: string) {
    return await this.messageAttachmentRepository.findOneOrFail({
      where: { messageId, attachmentId },
      relations: { attachment: true },
    });
  }

  async checkUserAccess(
    attachmentId: string,
    userId: string,
  ): Promise<boolean> {
    return this.messageAttachmentRepository
      .createQueryBuilder('ma')
      .innerJoin('ma.message', 'message')
      .innerJoin('message.conversation', 'conversation')
      .innerJoin('conversation.members', 'member')
      .innerJoin('member.user', 'user')
      .where('ma.attachmentId = :attachmentId', { attachmentId })
      .andWhere('user.id = :userId', { userId })
      .getExists();
  }

  async softDeleteByMessageId(messageId: string) {
    const result = await this.messageAttachmentRepository.softDelete({
      messageId,
    });

    if (!result.affected) {
      throw new NotFoundException(ErrorMessages.MESSAGE_ATTACHMENT_NOT_FOUND);
    }

    return {
      success: true,
      message: SuccessMessages.MESSAGE_ATTACHMENT_DELETED,
    };
  }
}
