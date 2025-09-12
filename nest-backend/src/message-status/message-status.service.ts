import { MessagesService } from '@app/messages/messages.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageStatus } from './entities/message-status.entity';
import { MessageStatusEnum } from './types/message-status.enum';
import { Not } from 'typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MessageStatusService {
  constructor(
    @InjectRepository(MessageStatus)
    private messageStatusRepository: Repository<MessageStatus>,

    private readonly messageService: MessagesService,
  ) {}

  async updateStatus(
    messageId: string,
    receiverId: string,
    status: MessageStatusEnum,
  ) {
    const update: Partial<MessageStatus> = { status };

    if (status === MessageStatusEnum.DELIVERED) {
      update.delivered_at = new Date();
    }

    if (status === MessageStatusEnum.READ) {
      update.read_at = new Date();
    }

    await this.messageStatusRepository.update(
      { message_id: messageId, receiver_id: receiverId },
      update,
    );

    // If status is READ, check if all recipients have read the message
    if (status === MessageStatusEnum.READ) {
      const unreadCount = await this.messageStatusRepository.count({
        where: {
          message_id: messageId,
          status: Not(MessageStatusEnum.READ),
        },
      });

      if (unreadCount === 0) {
        await this.messageService.markReadByAll(messageId);
      }
    }
  }
}
