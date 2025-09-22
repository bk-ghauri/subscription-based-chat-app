import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class SignedUrlService {
  constructor(
    private readonly jwtService: JwtService,
    // private readonly configService: ConfigService,
  ) {}

  generateAttachmentToken(
    attachmentId: string,
    // expiresIn = this.configService.get('url.expiry'),
  ): string {
    // return this.jwtService.sign({ attachmentId }, { expiresIn });
    return this.jwtService.sign({ attachmentId });
  }

  verifyAttachmentToken(token: string): string {
    try {
      const payload = this.jwtService.verify<{ attachmentId: string }>(token);
      return payload.attachmentId;
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired link');
    }
  }
}
