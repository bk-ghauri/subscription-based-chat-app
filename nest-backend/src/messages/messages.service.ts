import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Message } from './entities/message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@app/typeorm/entities/User';
import { Repository } from 'typeorm';
import { Conversation } from '@app/conversations/entities/conversation.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
  ) {}

  async create(dto: CreateMessageDto) {
    const conversation = await this.conversationRepository.findOne({
      where: { conversation_id: dto.conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const sender = await this.userRepository.findOne({
      where: { user_id: dto.senderId },
    });
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
      where: { conversation: { conversation_id: conversationId } },
      relations: ['sender', 'attachments', 'conversation'],
      order: { created_at: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform into safe DTOs to prevent leaking sensitive info to frontend
    return messages.map((msg) => this.toMessageResponse(msg));
  }
  // Helper to transform Message entity to safe DTO
  private toMessageResponse(msg: Message) {
    return {
      id: msg.message_id,
      body: msg.body,
      createdAt: msg.created_at,
      sender: msg.sender
        ? {
            id: msg.sender.user_id,
            displayName: msg.sender.display_name,
            avatar: msg.sender.avatar_url,
          }
        : null,
      conversationId: msg.conversation.conversation_id,
      attachments:
        msg.attachments?.map((a) => ({
          id: a.attachment_id,
          url: a.file_url,
        })) || [],
    };
  }

  findAll() {
    return `This action returns all messages`;
  }

  findOne(id: number) {
    return `This action returns a #${id} message`;
  }

  update(id: number, updateMessageDto: UpdateMessageDto) {
    return `This action updates a #${id} message`;
  }

  remove(id: number) {
    return `This action removes a #${id} message`;
  }
}
