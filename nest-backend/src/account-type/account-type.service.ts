import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountType } from './entities/account-type.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AccountTypeService {
  constructor(
    @InjectRepository(AccountType)
    private readonly repo: Repository<AccountType>,
  ) {}

  async findByUserId(userId: string) {
    return this.repo.findOne({ where: { user_id: userId } });
  }
}
