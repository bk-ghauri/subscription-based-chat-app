import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '@app/users/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseObject } from './responses/user-response';
import { AccountRole } from '@app/account-types/types/account-type.enum';
import { AccountTypesService } from '@app/account-types/account-types.service';
import { UpdateRefreshTokenDto } from './dto/update-refresh-token.dto';
import { ErrorMessages } from '@app/common/strings/error-messages';
import { SuccessMessages } from '@app/common/strings/success-messages';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,

    private readonly accountTypeService: AccountTypesService,
  ) {}

  async updateHashedRefreshToken(dto: UpdateRefreshTokenDto) {
    return await this.userRepository.update(
      { id: dto.userId },
      { hashedRefreshToken: dto.hashedRefreshToken },
    );
  }

  async create(createUserDto: CreateUserDto) {
    const user = await this.userRepository.save(
      this.userRepository.create(createUserDto),
    );
    await this.accountTypeService.saveOne(user.id, AccountRole.FREE);
    return user;
  }

  async remove(userId: string) {
    const result = await this.userRepository.delete({ id: userId });
    if (result.affected === 0) {
      throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
    }
    return { message: SuccessMessages.USER_DELETED };
  }

  async findAll() {
    return this.userRepository.find();
  }

  async findByEmail(email: string) {
    return await this.userRepository.findOne({
      where: {
        email,
      },
    });
  }

  async findByEmailWithPassword(email: string) {
    return await this.userRepository.findOne({
      where: {
        email,
      },
      select: { id: true, email: true, password: true },
    });
  }

  async findByDisplayName(displayName: string) {
    return await this.userRepository.findOne({
      where: { displayName },
    });
  }

  async findUsersByIds(userIds: string[]) {
    return this.userRepository.findBy({ id: In(userIds) });
  }

  async findOne(userId: string) {
    return this.userRepository.findOne({
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
    const user = await this.userRepository.findOne({
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
      throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
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
