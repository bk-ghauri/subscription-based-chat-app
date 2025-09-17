import { JwtAuthGuard } from '@app/auth/utils/Guards';
import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import express from 'express';
import { Public } from '@app/auth/decorators/public.decorator';

@UseGuards(JwtAuthGuard)
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentService: AttachmentsService) {}
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const user = req.user.id;
    if (!file) {
      throw new BadRequestException('File is required');
    }
    // service will save metadata but leave message=null for now
    return this.attachmentService.saveUnlinkedAttachment(file, user);
  }

  // @Get(':id')
  // async getAttachment(
  //   @Param('id') id: string,
  //   @Req() req: any,
  //   @Res() res: express.Response,
  // ) {
  //   const user = req.user.id;
  //   const filePath = await this.attachmentService.getSecureFilePath(id, user);

  //   // Stream the file
  //   return res.sendFile(filePath);
  // }

  @Get(':id/signed-url')
  async getSignedUrl(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    const signedUrl = this.attachmentService.getSignedUrl(id, userId);
    return signedUrl;
  }

  @Public()
  @Get('download/:id')
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
