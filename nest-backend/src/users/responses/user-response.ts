import { AccountRole } from '@app/account-types/types/account-type.enum';

export class UserResponseObject {
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: Date;
  accountType: AccountRole;
}
