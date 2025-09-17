import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountType } from './entities/account-type.entity';
import { Repository } from 'typeorm';
import { AccountRole } from './types/account-type.enum';

@Injectable()
export class AccountTypesService {
  constructor(
    @InjectRepository(AccountType)
    private readonly accountTypeRepository: Repository<AccountType>,
  ) {}

  async findOne(userId: string) {
    return await this.accountTypeRepository.findOne({
      where: { userId },
    });
  }

  async saveOne(userId: string, type: AccountRole) {
    await this.accountTypeRepository.save({ userId, type });
  }
}
