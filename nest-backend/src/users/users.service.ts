import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '@app/users/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { AccountType } from '@app/account-types/entities/account-type.entity';
import { UserResponseDto } from './dto/user-response.dto';
import { AccountRole } from '@app/account-types/types/account-type.enum';
import { AccountTypesService } from '@app/account-types/account-types.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private UserRepo: Repository<User>,

    private readonly accountTypeService: AccountTypesService,
  ) {}

  async updateHashedRefreshToken(
    userId: string,
    hashedRefreshToken: string | null,
  ) {
    return await this.UserRepo.update({ id: userId }, { hashedRefreshToken });
  }

  async create(createUserDto: CreateUserDto) {
    const user = await this.UserRepo.save(this.UserRepo.create(createUserDto));
    await this.accountTypeService.saveOne(user.id, AccountRole.FREE);
    return user;
  }

  // async update(user_id: string, updateUserDto: UpdateUserDto) {
  //   await this.UserRepo.update({ user_id }, updateUserDto);
  //   return this.UserRepo.findOneBy({ user_id });
  // }

  async remove(userId: string) {
    const result = await this.UserRepo.delete({ id: userId });
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return { message: `User ${userId} deleted successfully` };
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

  async findByDisplayName(displayName: string) {
    return await this.UserRepo.findOne({
      where: { displayName },
    });
  }

  async findUsersByIds(userIds: string[]) {
    return this.UserRepo.findBy({ id: In(userIds) });
  }

  async findOne(userId: string) {
    return this.UserRepo.findOne({
      where: { id: userId },
      select: [
        'id',
        'email',
        'displayName',
        'avatarUrl',
        'createdAt',
        'accountType',
      ],
    });
  }

  async returnProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.UserRepo.findOne({
      where: { id: userId },
      relations: ['accountType'],
      select: ['id', 'email', 'displayName', 'avatarUrl', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const response: UserResponseDto = {
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      accountType: user.accountType?.role as AccountRole,
    };

    return response;
  }
}
