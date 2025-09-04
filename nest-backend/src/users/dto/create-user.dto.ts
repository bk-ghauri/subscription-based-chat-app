import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateUserDto {
  @IsString()
  display_name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  google_id?: string; // only set if Google signup

  @IsString()
  password: string;

  @IsOptional()
  @IsUrl()
  avatar_url?: string; // optional profile picture URL
}
