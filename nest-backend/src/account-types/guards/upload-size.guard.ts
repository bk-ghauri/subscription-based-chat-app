import { AccountTypesService } from '@app/account-types/account-types.service';
import { AccountRole } from '@app/account-types/types/account-role.enum';
import { ErrorMessages } from '@app/common/strings/error-messages';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class UploadSizeGuard implements CanActivate {
  constructor(private readonly accountTypeService: AccountTypesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user.id;

    if (!userId) {
      throw new UnauthorizedException(ErrorMessages.UNAUTHORIZED);
    }

    const accountType = await this.accountTypeService.findOne(userId);
    if (!accountType) {
      throw Error(ErrorMessages.ACCOUNT_TYPE_NOT_FOUND);
    }

    let limit =
      accountType.role === AccountRole.PREMIUM
        ? 50 * 1024 * 1024
        : 5 * 1024 * 1024; // 5 MB for FREE, 50 MB for PREMIUM

    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > limit) {
      throw new BadRequestException(
        `Upload too large. Max allowed: ${limit / (1024 * 1024)} MB`,
      );
    }

    return true;
  }
}
