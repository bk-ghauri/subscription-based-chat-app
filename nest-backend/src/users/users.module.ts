import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@app/users/entities/user.entity';
import { AccountType } from '@app/account-type/entities/account-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, AccountType])],
  controllers: [UsersController],
  providers: [UserService],
})
export class UsersModule {}
