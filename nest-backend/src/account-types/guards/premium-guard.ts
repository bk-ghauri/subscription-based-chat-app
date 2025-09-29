import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AccountRole } from '@app/account-types/types/account-role.enum';
import { ErrorMessages } from '../../common/strings/error-messages';
import { AccountTypesService } from '@app/account-types/account-types.service';

@Injectable()
export class PremiumGuard implements CanActivate {
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

    if (accountType.role !== AccountRole.PREMIUM) {
      throw new ForbiddenException(ErrorMessages.NOT_PREMIUM);
    }

    return true;
  }
}
