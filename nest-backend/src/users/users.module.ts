import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@app/typeorm/entities/User';
import { AccountType } from '@app/typeorm/entities/AccountType';

@Module({
  imports: [TypeOrmModule.forFeature([User, AccountType])],
  controllers: [UsersController],
  providers: [UserService],
})
export class UsersModule {}
