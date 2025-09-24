// src/attachments/attachments.service.ts
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from './entities/attachment.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AccountTypesService } from '@app/account-types/account-types.service';
import { AccountRole } from '@app/account-types/types/account-type.enum';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { AttachmentResponse } from './responses/attachment-response';
import { SignedUrlService } from './signed-url.service';
import { MessageAttachmentsService } from '@app/message-attachments/message-attachments.service';
import { ErrorMessages } from '@app/common/strings/error-messages';
import { UsersService } from '@app/users/users.service';
import { MEDIA_ATTACHMENTS_DIR } from '@app/common/constants';

@Injectable()
export class AttachmentsService {
  private readonly logger = new Logger(AttachmentsService.name);
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
    private readonly accountTypeService: AccountTypesService,
    private readonly signedUrlService: SignedUrlService,
    private readonly messageAttachmentService: MessageAttachmentsService,
    private readonly userService: UsersService,
  ) {}

  async create(file: Express.Multer.File, userId: string) {
    const accountType = await this.accountTypeService.findOne(userId);

    const planLimit =
      accountType?.role === AccountRole.PREMIUM
        ? 50 * 1024 * 1024
        : 5 * 1024 * 1024;

    if (file.size > planLimit) {
      // Delete the uploaded file to avoid leftovers

      try {
        await fs.unlink(file.path);
      } catch (err) {
        // log but don’t crash
        this.logger.error('Failed to cleanup oversized file', err);
      }

      throw new BadRequestException(ErrorMessages.FILE_TOO_LARGE(planLimit));
    }

    const fileUrl = path.join(MEDIA_ATTACHMENTS_DIR, file.filename);

    // Save metadata to DB

    const dto: CreateAttachmentDto = {
      fileUrl,
      fileType: file.mimetype,
      size: file.size,
      uploaderId: userId,
    };

    const user = await this.userService.findOne(userId);

    const attachment = this.attachmentRepository.create({
      ...dto,
      uploader: { id: dto.uploaderId },
    });

    try {
      const saved = await this.attachmentRepository.save(attachment);

      const response: AttachmentResponse = {
        id: saved.id,
        fileUrl: saved.fileUrl,
        fileType: saved.fileType,
        size: saved.size,
        createdAt: saved.createdAt,
      };

      return response;
    } catch (err) {
      // Cleanup file if DB save fails
      await fs.unlink(file.path).catch(() => {});
      throw new InternalServerErrorException('Could not save attachment');
    }
  }

  async getSignedUrl(attachmentId: string, userId: string) {
    const attachment = await this.findOne(attachmentId);
    if (!attachment) throw new NotFoundException('Attachment not found');

    const hasAccess = await this.messageAttachmentService.checkUserAccess(
      attachmentId,
      userId,
    );
    if (!hasAccess) throw new ForbiddenException('You do not have access');

    const token = this.signedUrlService.generateAttachmentToken(attachmentId);
    return { url: `/attachments/download/${attachmentId}?token=${token}` };
  }

  async getDownloadPath(id: string, token: string) {
    const attachmentId = this.signedUrlService.verifyAttachmentToken(token);
    if (attachmentId !== id)
      throw new ForbiddenException('You do not have access');

    const attachment = await this.findOne(id);
    if (!attachment) throw new NotFoundException('Attachment not found');

    const absPath = attachment.fileUrl;
    return absPath;
  }

  async findOne(id: string) {
    return await this.attachmentRepository.findOne({ where: { id } });
  }
}
