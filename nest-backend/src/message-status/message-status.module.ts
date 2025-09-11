import { Module } from '@nestjs/common';
import { MessageStatusService } from './message-status.service';

@Module({
  providers: [MessageStatusService],
})
export class MessageStatusModule {}
