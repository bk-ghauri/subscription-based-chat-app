import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '@app/users/entities/User';
import { UpdateUserDto } from './dto/update-user.dto';
import { AccountType } from '@app/typeorm/entities/AccountType';

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

  async update(user_id: string, updateUserDto: UpdateUserDto) {
    await this.UserRepo.update({ user_id }, updateUserDto);
    return this.UserRepo.findOneBy({ user_id });
  }

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
        'google_id',
        'display_name',
        'avatar_url',
        'created_at',
        'accountType',
      ],
    });
  }
}
