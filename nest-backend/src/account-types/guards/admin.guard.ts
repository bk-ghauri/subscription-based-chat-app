import { AccountTypesService } from '@app/account-types/account-types.service';
import { AccountRole } from '@app/account-types/types/account-role.enum';
import { ErrorMessages } from '@app/common/strings/error-messages';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly accountTypeService: AccountTypesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.id;

    if (!userId) {
      throw new ForbiddenException(ErrorMessages.UNAUTHORIZED);
    }

    const accountType = await this.accountTypeService.findOne(userId);
    if (!accountType) {
      throw Error(ErrorMessages.ACCOUNT_TYPE_NOT_FOUND);
    }

    if (accountType.role !== AccountRole.ADMIN) {
      throw new ForbiddenException(ErrorMessages.NOT_ADMIN);
    }

    return true;
  }
}
