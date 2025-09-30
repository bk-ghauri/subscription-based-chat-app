import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersModule } from '@app/users/users.module';
import { SuspendedModule } from '@app/suspended/suspended.module';

@Module({
  imports: [UsersModule, SuspendedModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
