import { AccountRole } from '@app/account-type/types/account-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  display_name: string;

  @ApiProperty()
  avatar_url: string | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  accountType: AccountRole;
}
