import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountType } from './entities/account-type.entity';
import { Repository } from 'typeorm';
<<<<<<< HEAD
import { CreateAccountTypeDto } from './dto/create-account-type.dto';
import { UpdateAccountTypeDto } from './dto/update-account-type.dto';
import { ErrorMessages } from '@app/common/strings/error-messages';
=======
import { AccountRole } from './types/account-role.enum';
>>>>>>> feature/chat-attachments

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
    const result = await this.accountTypeRepository.update(
      { userId: dto.userId },
      { role: dto.role },
    );

    if (!result.affected) {
      throw new NotFoundException(ErrorMessages.ACCOUNT_TYPE_NOT_FOUND);
    }
  }
}
