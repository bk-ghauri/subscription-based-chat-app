import { IsUUID, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateRefreshTokenDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  @MinLength(44)
  hashedRefreshToken: string | null;
}
