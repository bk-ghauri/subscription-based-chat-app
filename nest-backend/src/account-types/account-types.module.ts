import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountType } from './entities/account-type.entity';
import { AccountTypesService } from './account-types.service';
import { PremiumGuard } from './guards/premium-guard';
import { UploadSizeGuard } from './guards/upload-size.guard';
import { AdminGuard } from './guards/admin.guard';

@Module({
  imports: [TypeOrmModule.forFeature([AccountType])],
  providers: [AccountTypesService, PremiumGuard, UploadSizeGuard, AdminGuard],
  exports: [AccountTypesService, PremiumGuard, UploadSizeGuard, AdminGuard],
})
export class AccountTypesModule {}
