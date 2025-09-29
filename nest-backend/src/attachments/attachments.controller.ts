import { JwtAuthGuard } from '@app/auth/utils/Guards';
import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import express from 'express';
import { Public } from '@app/auth/decorators/public.decorator';
import { UserId } from '@app/common/decorators/user-id.decorator';
import { UploadSizeGuard } from '../account-types/guards/upload-size.guard';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorMessages } from '@app/common/strings/error-messages';

@UseGuards(JwtAuthGuard)
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentService: AttachmentsService) {}

  @Post()
  @UseGuards(UploadSizeGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload an attachment file' })
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ description: 'File uploaded successfully' })
  @ApiBadRequestResponse({
    description: 'No file attached or file exceeds size limits',
  })
  @ApiUnauthorizedResponse()
  @ApiBearerAuth()
  async uploadAttachment(
    @UploadedFile() file: Express.Multer.File,
    @UserId() userId: string,
  ) {
    if (!file) {
      throw new BadRequestException(ErrorMessages.NO_FILE_ATTACHED);
    }
    // service will save metadata but leave message=null for now
    return this.attachmentService.create(file, userId);
  }

  @Get(':id/signed-url')
  @ApiOperation({ summary: 'Get a signed URL for downloading an attachment' })
  @ApiOkResponse({ description: 'Signed URL retrieved successfully' })
  @ApiForbiddenResponse({ description: 'Unauthorized or forbidden access' })
  @ApiNotFoundResponse({ description: 'Attachment not found' })
  @ApiBearerAuth()
  async getSignedUrl(@Param('id') id: string, @UserId() userId: string) {
    const signedUrl = this.attachmentService.getSignedUrl(id, userId);
    return signedUrl;
  }

  @Public()
  @Get('download/:id')
  @ApiOperation({ summary: 'Download an attachment using a signed token' })
  @ApiOkResponse({ description: 'File downloaded successfully' })
  @ApiForbiddenResponse({ description: 'Invalid or expired token' })
  @ApiNotFoundResponse({ description: 'Attachment not found' })
  async download(
    @Param('id') id: string,
    @Query('token') token: string,
    @Res() res: express.Response,
  ) {
    const downloadPath = await this.attachmentService.getDownloadPath(
      id,
      token,
    );
    return res.sendFile(downloadPath);
  }
}
