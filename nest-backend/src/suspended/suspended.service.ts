import { Injectable } from '@nestjs/common';
import { CreateSuspendedDto } from './dto/create-suspended.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Suspended } from './entities/suspended.entity';
import { Repository } from 'typeorm';

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
    await this.suspendedRepository.softDelete(userId);
    return { success: true, message: `User ${userId} has been unbanned` };
  }

  async findAll() {
    return await this.suspendedRepository.find();
  }

  async findOneByUserId(userId: string) {
    const suspended = await this.suspendedRepository.findOne({
      where: { userId },
      withDeleted: false,
    });

    if (!suspended) {
      return { message: 'This user is not suspended' };
    }
    return suspended;
  }

  async findHistoryByUserId(userId: string) {
    const suspendeds = await this.suspendedRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      withDeleted: true, // include soft-deleted records
    });

    if (!suspendeds) {
      return { message: 'This user was never banned' };
    }
    return suspendeds;
  }
}
