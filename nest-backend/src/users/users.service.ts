import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@app/typeorm/entities/User';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private UserRepo: Repository<User>) {}

  async updateHashedRefreshToken(userId: string, hashedRefreshToken: string) {
    return await this.UserRepo.update(
      { user_id: userId },
      { hashed_refresh_token: hashedRefreshToken },
    );
  }

  async create(createUserDto: CreateUserDto) {
    const user = await this.UserRepo.create(createUserDto);
    return await this.UserRepo.save(user);
  }

  remove(user_id: string) {
    return `This action removes a #${user_id} user`;
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
        'hashed_refresh_token',
        'accountType',
      ],
    });
  }
}
