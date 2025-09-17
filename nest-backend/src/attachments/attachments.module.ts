import { Module } from '@nestjs/common';
import { AttachmentsController } from './attachments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from './entities/attachment.entity';
import { AttachmentsService } from './attachments.service';
import { AuthModule } from '@app/auth/auth.module';
import { SignedUrlService } from './signed-url.service';
import { ConfigModule } from '@nestjs/config';
import url from './config/url.config';
import { AccountTypesModule } from '@app/account-types/account-types.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attachment]),
    ConfigModule.forFeature(url),
    AuthModule,
    AccountTypesModule,
  ],
  controllers: [AttachmentsController],
  providers: [AttachmentsService, SignedUrlService],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
