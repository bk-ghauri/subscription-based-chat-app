import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '@app/users/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { AccountType } from '@app/account-types/entities/account-type.entity';
import { UserResponseObject } from './responses/user-response';
import { AccountRole } from '@app/account-types/types/account-type.enum';
import { AccountTypesService } from '@app/account-types/account-types.service';
import { UpdateRefreshTokenDto } from './dto/update-refresh-token.dto';
import { ErrorMessages } from '@app/common/constants/error-messages';
import { SuccessMessages } from '@app/common/constants/success-messages';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private UserRepository: Repository<User>,

    private readonly accountTypeService: AccountTypesService,
  ) {}

  async updateHashedRefreshToken(dto: UpdateRefreshTokenDto) {
    return await this.UserRepository.update(
      { id: dto.userId },
      { hashedRefreshToken: dto.hashedRefreshToken },
    );
  }

  async create(createUserDto: CreateUserDto) {
    const user = await this.UserRepository.save(
      this.UserRepository.create(createUserDto),
    );
    await this.accountTypeService.saveOne(user.id, AccountRole.FREE);
    return user;
  }

  async remove(userId: string) {
    const result = await this.UserRepository.delete({ id: userId });
    if (result.affected === 0) {
      throw new NotFoundException(ErrorMessages.userNotFound);
    }
    return { message: SuccessMessages.userDeleted };
  }

  async findAll() {
    return this.UserRepository.find();
  }

  async findByEmail(email: string) {
    return await this.UserRepository.findOne({
      where: {
        email,
      },
    });
  }

  async findByEmailWithPassword(email: string) {
    return await this.UserRepository.findOne({
      where: {
        email,
      },
      select: { id: true, email: true, password: true },
    });
  }

  async findByDisplayName(displayName: string) {
    return await this.UserRepository.findOne({
      where: { displayName },
    });
  }

  async findUsersByIds(userIds: string[]) {
    return this.UserRepository.findBy({ id: In(userIds) });
  }

  async findOne(userId: string) {
    return this.UserRepository.findOne({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
        accountType: true,
        hashedRefreshToken: true,
      },
    });
  }

  async returnProfile(userId: string): Promise<UserResponseObject> {
    const user = await this.UserRepository.findOne({
      where: { id: userId },
      relations: { accountType: true },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(ErrorMessages.userNotFound);
    }

    const response: UserResponseObject = {
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      accountType: user.accountType?.role as AccountRole,
    };

    return response;
  }
}
