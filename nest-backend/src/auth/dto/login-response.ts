import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseObject {
  userId: string;
  accessToken: string;
  refreshToken: string;
}
