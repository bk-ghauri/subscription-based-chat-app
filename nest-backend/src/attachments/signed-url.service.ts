import { ErrorMessages } from '@app/common/strings/error-messages';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

@Injectable()
export class SignedUrlService {
  constructor(private readonly jwtService: JwtService) {}

  generateAttachmentToken(attachmentId: string): string {
    return this.jwtService.sign({ attachmentId });
  }

  verifyAttachmentToken(token: string): string {
    try {
      const payload = this.jwtService.verify<{ attachmentId: string }>(token);
      return payload.attachmentId;
    } catch (e) {
      throw new UnauthorizedException(ErrorMessages.INVALID_LINK);
    }
  }
}
