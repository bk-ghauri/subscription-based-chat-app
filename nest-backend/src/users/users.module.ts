import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@app/users/entities/user.entity';
import { AccountTypesModule } from '@app/account-types/account-types.module';
import { MulterModule } from '@nestjs/platform-express';
import { AVATARS_DIR } from '@app/common/constants';
import { createMulterConfig } from '@app/common/utils/multer.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AccountTypesModule,
    MulterModule.register(
      createMulterConfig(AVATARS_DIR, ['image/jpeg', 'image/png'], 5),
    ),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
