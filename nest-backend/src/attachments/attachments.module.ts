import { Module } from '@nestjs/common';
import { AttachmentsController } from './attachments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from './entities/attachment.entity';
import { AttachmentsService } from './attachments.service';
import { AuthModule } from '@app/auth/auth.module';
import { SignedUrlService } from './signed-url.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MessageAttachmentsModule } from '@app/message-attachments/message-attachments.module';
import { UsersModule } from '@app/users/users.module';
import urlConfig from './config/url.config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { MEDIA_ATTACHMENTS_DIR } from '@app/common/constants';
import { MulterModule } from '@nestjs/platform-express';
import { AccountTypesModule } from '@app/account-types/account-types.module';
import { createMulterConfig } from '@app/common/utils/multer.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attachment]),
    ConfigModule.forFeature(urlConfig),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<JwtModuleOptions>('url')!,
    }),
    MulterModule.register(
      createMulterConfig(
        MEDIA_ATTACHMENTS_DIR,
        [
          'image/jpeg',
          'image/png',
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        50,
      ),
    ),
    AuthModule,
    MessageAttachmentsModule,
    UsersModule,
    AccountTypesModule,
  ],
  controllers: [AttachmentsController],
  providers: [AttachmentsService, SignedUrlService],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
