import { ApiProperty } from '@nestjs/swagger';

export class AttachmentResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fileUrl: string;

  @ApiProperty()
  fileType: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  createdAt: Date;
}
