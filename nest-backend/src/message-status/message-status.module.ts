import { forwardRef, Module } from '@nestjs/common';
import { MessageStatusService } from './message-status.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageStatus } from './entities/message-status.entity';
import { MessagesModule } from '@app/messages/messages.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageStatus]),
    forwardRef(() => MessagesModule),
  ],
  providers: [MessageStatusService],
  exports: [MessageStatusService],
})
export class MessageStatusModule {}
