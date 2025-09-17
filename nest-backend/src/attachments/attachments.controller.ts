import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('attachments')
export class AttachmentsController {
  // @Post('upload')
  // @UseInterceptors(
  //   FileInterceptor('file', {
  //     storage: diskStorage({
  //       destination: './uploads',
  //       filename: (req, file, cb) => {
  //         const uniqueSuffix =
  //           Date.now() + '-' + Math.round(Math.random() * 1e9);
  //         cb(
  //           null,
  //           file.fieldname + '-' + uniqueSuffix + extname(file.originalname),
  //         );
  //       },
  //     }),
  //     limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for now
  //     fileFilter: (req, file, cb) => {
  //       if (!file.originalname.match(/\.(jpg|jpeg|png|pdf|docx)$/)) {
  //         return cb(new Error('Only image/pdf/docx files allowed!'), false);
  //       }
  //       cb(null, true);
  //     },
  //   }),
  // )
  // uploadFile(@UploadedFile() file: Express.Multer.File) {
  //   return {
  //     filename: file.filename,
  //     path: file.path,
  //     mimetype: file.mimetype,
  //     size: file.size,
  //   };
  // }
}
