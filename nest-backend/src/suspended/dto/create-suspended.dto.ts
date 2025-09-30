import { MaxTextLength } from '@app/common/validators/max-text-length';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateSuspendedDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MaxTextLength(255)
  banReason: string;
}
