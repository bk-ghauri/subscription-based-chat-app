import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateUserDto {
  @IsString()
  display_name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  google_id?: string; // only set if Google signup

  @IsOptional()
  @IsString()
  password?: string; // required if normal signup, null if Google signup

  @IsOptional()
  @IsUrl()
  avatar_url?: string; // optional profile picture URL
}
