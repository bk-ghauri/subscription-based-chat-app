import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { AccountRole } from '../types/account-type.enum';

export class CreateAccountTypeDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  @IsEnum(AccountRole)
  role: AccountRole;
}
