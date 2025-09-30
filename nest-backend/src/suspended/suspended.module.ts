import { Module } from '@nestjs/common';
import { SuspendedService } from './suspended.service';

@Module({
  providers: [SuspendedService]
})
export class SuspendedModule {}
