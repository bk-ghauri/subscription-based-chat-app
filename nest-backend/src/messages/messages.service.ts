import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Message } from './entities/message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@app/typeorm/entities/User';
import { Repository } from 'typeorm';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository('Conversation')
    private readonly conversationRepository: Repository<any>,
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

    return this.messageRepository.save(message);
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
