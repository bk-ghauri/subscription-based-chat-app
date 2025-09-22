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
import { IsNull, Repository } from 'typeorm';
import { Attachment } from './entities/attachment.entity';
import { User } from '@app/users/entities/user.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AccountTypesService } from '@app/account-types/account-types.service';
import { AccountRole } from '@app/account-types/types/account-type.enum';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { ReturnAttachmentDto } from './dto/return-attachment.dto';
import { SignedUrlService } from './signed-url.service';

@Injectable()
export class AttachmentsService {
  private readonly logger = new Logger(AttachmentsService.name);
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentRepo: Repository<Attachment>,
    private readonly accountTypeService: AccountTypesService,
    private readonly signedUrlService: SignedUrlService,
  ) {}

  async saveUnlinkedAttachment(file: Express.Multer.File, userId: string) {
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

      throw new BadRequestException(
        `File exceeds your plan limit of ${planLimit / (1024 * 1024)} MB`,
      );
    }

    const relativePath = path.relative(process.cwd(), file.path);
    const fileUrl = `/${relativePath.replace(/\\/g, '/')}`;

    // Save metadata to DB

    const dto: CreateAttachmentDto = {
      fileUrl,
      fileType: file.mimetype,
      size: file.size,
      uploaderId: userId,
      messageId: null, // link later when message is created
    };

    const attachment = this.attachmentRepo.create(dto);

    try {
      const saved = await this.attachmentRepo.save(attachment);

      const returnDto: ReturnAttachmentDto = {
        id: saved.id,
        fileUrl: saved.fileUrl,
        fileType: saved.fileType,
        size: saved.size,
        createdAt: saved.createdAt,
      };
      return returnDto;
    } catch (err) {
      // Cleanup file if DB save fails
      await fs.unlink(file.path).catch(() => {});
      throw new InternalServerErrorException('Could not save attachment');
    }
  }

  async findOneWithMessage(id: string) {
    return await this.attachmentRepo.findOne({
      where: { id },
      select: ['id', 'fileUrl'],
      relations: ['message'],
    });
  }

  async getSignedUrl(attachmentId: string, userId: string) {
    const attachment = await this.findOneWithMessage(attachmentId);

    if (!attachment) throw new NotFoundException('Attachment not found');

    const isMember = await this.attachmentRepo
      .createQueryBuilder('attachment')
      .innerJoin('attachment.message', 'message')
      .innerJoin('message.conversation', 'conversation')
      .innerJoin('conversation.members', 'member')
      .innerJoin('member.user', 'user')
      .where('attachment.id = :attachmentId', { attachmentId })
      .andWhere('user.id = :userId', { userId })
      .getExists(); // efficient EXISTS check

    if (!isMember) throw new ForbiddenException('You do not have access');

    const token = this.signedUrlService.generateAttachmentToken(attachmentId);
    return { url: `/attachments/download/${attachmentId}?token=${token}` };
  }

  async getDownloadPath(id: string, token: string) {
    const attachmentId = this.signedUrlService.verifyAttachmentToken(token);
    if (attachmentId !== id)
      throw new ForbiddenException('You do not have access');

    const attachment = await this.findOne(id);
    if (!attachment) throw new NotFoundException('Attachment not found');

    const absPath = path.resolve(attachment.fileUrl);
    return absPath;
  }

  // async getSecureFilePath(attachmentId: string, userId: string) {
  //   // Load attachment + file path
  //   const attachment = await this.attachmentRepo.findOne({
  //     where: { id: attachmentId },
  //     select: ['id', 'fileUrl'],
  //     relations: ['message'],
  //   });

  //   if (!attachment) {
  //     throw new NotFoundException('Attachment not found');
  //   }

  //   // Check membership directly in DB
  //   const isMember = await this.attachmentRepo
  //     .createQueryBuilder('attachment')
  //     .innerJoin('attachment.message', 'message')
  //     .innerJoin('message.conversation', 'conversation')
  //     .innerJoin('conversation.members', 'member')
  //     .innerJoin('member.user', 'user')
  //     .where('attachment.id = :attachmentId', { attachmentId })
  //     .andWhere('user.id = :userId', { userId })
  //     .getExists(); // efficient EXISTS check

  //   if (!isMember) {
  //     throw new ForbiddenException('You do not have access to this file');
  //   }

  //   const absPath = path.resolve(attachment.fileUrl); // assuming fileUrl stores relative path
  //   return absPath;
  // }

  // async findWithMessageAndConversation(id: string) {
  //   return this.attachmentRepo.findOne({
  //     where: { id },
  //     relations: [
  //       'message',
  //       'message.conversation',
  //       'message.conversation.members',
  //       'message.conversation.members.user',
  //     ],
  //   });
  // }

  async findOne(id: string) {
    return await this.attachmentRepo.findOne({ where: { id } });
  }

  async findOneWithoutMessage(id: string) {
    return await this.attachmentRepo.findOne({
      where: { id, messageId: IsNull() }, // ensure not already linked
    });
  }

  async saveWithMessage(attachment: Attachment) {
    await this.attachmentRepo.save(attachment);
  }
}
