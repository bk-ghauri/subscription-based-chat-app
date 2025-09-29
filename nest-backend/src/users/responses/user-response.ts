import { AccountRole } from '@app/account-types/types/account-role.enum';

export class UserResponse {
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: Date;
  accountType: AccountRole;
}
