import { Injectable } from '@nestjs/common';
import { CreateSuspendedDto } from './dto/create-suspended.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Suspended } from './entities/suspended.entity';
import { Repository } from 'typeorm';
import { SuccessMessages } from '@app/common/strings/success-messages';

@Injectable()
export class SuspendedService {
  constructor(
    @InjectRepository(Suspended)
    private readonly suspendedRepository: Repository<Suspended>,
  ) {}

  async createOne(dto: CreateSuspendedDto) {
    return await this.suspendedRepository.save(
      this.suspendedRepository.create(dto),
    );
  }

  async removeOne(userId: string) {
    const result = await this.suspendedRepository.softDelete({ userId });
    if (result.affected) {
      return { success: true, message: SuccessMessages.USER_UNBANNED };
    }
  }

  async findAll() {
    return await this.suspendedRepository.find();
  }

  async findOneByUserId(userId: string) {
    const suspended = await this.suspendedRepository.findOne({
      where: { userId },
      withDeleted: false,
    });

    return suspended;
  }

  async findHistoryByUserId(userId: string) {
    const suspendeds = await this.suspendedRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      withDeleted: true, // include soft-deleted records
    });

    if (!suspendeds) {
      return { message: SuccessMessages.USER_NEVER_BANNED };
    }
    return suspendeds;
  }
}
