import { Module } from '@nestjs/common';
import { SuspendedService } from './suspended.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Suspended } from './entities/suspended.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Suspended])],
  providers: [SuspendedService],
  exports: [SuspendedService],
})
export class SuspendedModule {}
