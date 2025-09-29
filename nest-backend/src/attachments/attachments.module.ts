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
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AccountTypesModule } from '@app/account-types/account-types.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attachment]),
    ConfigModule.forFeature(urlConfig),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<JwtModuleOptions>('url')!,
    }),

    MulterModule.register({
      storage: diskStorage({
        destination: MEDIA_ATTACHMENTS_DIR,
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname); // preserves .png, .jpg, etc.
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new Error('Unsupported file type'), false);
        }
        cb(null, true);
      },
    }),
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
