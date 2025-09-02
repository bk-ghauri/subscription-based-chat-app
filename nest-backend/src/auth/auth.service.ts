import { User } from '@app/typeorm/entities/User';
import { UserDetails } from '@app/utils/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}
  async validateUser(details: UserDetails) {
    console.log('Validating user with details:', details);
    const user = await this.userRepository.findOneBy({
      email: details.email,
    });
    if (user) {
      return user;
    }
    console.log('User not found, creating new user:');
    const newUser = this.userRepository.create(details);
    return this.userRepository.save(newUser);
  }
}
