import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageAttachment } from './entities/message-attachment.entity';
import { MessageAttachmentsService } from './message-attachments.service';

@Module({
  imports: [TypeOrmModule.forFeature([MessageAttachment])],
  exports: [MessageAttachmentsService],
  providers: [MessageAttachmentsService],
})
export class MessageAttachmentsModule {}
