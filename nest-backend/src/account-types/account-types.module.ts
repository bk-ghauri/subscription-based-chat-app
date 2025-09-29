import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountType } from './entities/account-type.entity';
import { AccountTypesService } from './account-types.service';
import { PremiumGuard } from './guards/premium-guard';
import { UploadSizeGuard } from './guards/upload-size.guard';

@Module({
  imports: [TypeOrmModule.forFeature([AccountType])],
  providers: [AccountTypesService, PremiumGuard, UploadSizeGuard],
  exports: [AccountTypesService, PremiumGuard, UploadSizeGuard],
})
export class AccountTypesModule {}
