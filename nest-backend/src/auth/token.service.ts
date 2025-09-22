import { JwtService } from '@nestjs/jwt';
import refreshJwtConfig from './config/refresh-jwt.config';
import * as config from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { AuthJwtPayload } from './types/auth-jwtPayload';
import jwtConfig from './config/jwt.config';
import * as jwt from 'jsonwebtoken';

export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(refreshJwtConfig.KEY)
    private refreshTokenConfig: config.ConfigType<typeof refreshJwtConfig>,
  ) {}

  async generateTokens(
    userId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: AuthJwtPayload = { userId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, this.refreshTokenConfig),
    ]);

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: any) {
    const payload = await this.jwtService.verifyAsync(token);
    const userId: string = payload.userId;
    return userId;
  }
}
