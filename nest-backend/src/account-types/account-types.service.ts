import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountType } from './entities/account-type.entity';
import { Repository } from 'typeorm';
import { CreateAccountTypeDto } from './dto/create-account-type.dto';
import { UpdateAccountTypeDto } from './dto/update-account-type.dto';

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

  async saveOne(dto: CreateAccountTypeDto) {
    await this.accountTypeRepository.save(dto);
  }

  async updateOne(dto: UpdateAccountTypeDto) {
    await this.accountTypeRepository.update(
      { userId: dto.userId },
      { role: dto.role },
    );
  }
}
