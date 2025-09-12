import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '@app/users/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { AccountType } from '@app/account-type/entities/account-type.entity';
import { UserResponseDto } from './dto/user-response.dto';
import { AccountRole } from '@app/account-type/types/account-type.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private UserRepo: Repository<User>,
    @InjectRepository(AccountType) private accTypeRepo: Repository<AccountType>,
  ) {}

  async updateHashedRefreshToken(
    userId: string,
    hashedRefreshToken: string | null,
  ) {
    return await this.UserRepo.update(
      { user_id: userId },
      { hashed_refresh_token: hashedRefreshToken },
    );
  }

  async create(createUserDto: CreateUserDto) {
    const user = await this.UserRepo.save(this.UserRepo.create(createUserDto));
    await this.accTypeRepo.save({ user_id: user.user_id, type: 'FREE' });
    return user;
  }

  // async update(user_id: string, updateUserDto: UpdateUserDto) {
  //   await this.UserRepo.update({ user_id }, updateUserDto);
  //   return this.UserRepo.findOneBy({ user_id });
  // }

  async remove(user_id: string) {
    const result = await this.UserRepo.delete({ user_id });
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }
    return { message: `User ${user_id} deleted successfully` };
  }

  async findAll() {
    return this.UserRepo.find();
  }

  async findByEmail(email: string) {
    return await this.UserRepo.findOne({
      where: {
        email,
      },
    });
  }

  async findByDisplayName(display_name: string) {
    return await this.UserRepo.findOne({
      where: { display_name },
    });
  }

  async findUsersByIds(userIds: string[]) {
    return this.UserRepo.findBy({ user_id: In(userIds) });
  }

  async findOne(user_id: string) {
    return this.UserRepo.findOne({
      where: { user_id },
      select: [
        'user_id',
        'email',
        'display_name',
        'avatar_url',
        'created_at',
        'accountType',
      ],
    });
  }

  async returnProfile(user_id: string): Promise<UserResponseDto> {
    const user = await this.UserRepo.findOne({
      where: { user_id },
      relations: ['accountType'],
      select: ['user_id', 'email', 'display_name', 'avatar_url', 'created_at'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }

    const response: UserResponseDto = {
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      accountType: user.accountType?.role as AccountRole,
    };

    return response;
  }
}
