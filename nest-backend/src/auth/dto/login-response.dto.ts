import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty()
  user_id: string;

  @ApiProperty()
  access_token: string;

  @ApiProperty()
  refresh_token: string;
}
