import { AccountRole } from '@app/account-types/types/account-role.enum';

export class UserResponseObject {
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: Date;
  accountType: AccountRole;
}
