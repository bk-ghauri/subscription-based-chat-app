import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountType } from './entities/account-type.entity';
import { AccountTypesService } from './account-types.service';

@Module({
  imports: [TypeOrmModule.forFeature([AccountType])],
  providers: [AccountTypesService],
  exports: [AccountTypesService],
})
export class AccountTypesModule {}
