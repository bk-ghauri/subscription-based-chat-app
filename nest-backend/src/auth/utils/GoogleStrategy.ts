import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { Inject, Injectable } from '@nestjs/common';
import { Auth } from 'firebase-admin/auth';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: AuthService,
  ) {
    super({
      clientID: '',
      clientSecret: '',
      callbackURL: 'https://localhost:3000/auth/google/redirect',
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    console.log('Google profile:', profile);
    const user = await this.authService.validateUser({
      displayName: profile.displayName,
      email: profile.emails![0].value,
    });
    console.log('Validated user:', user);
    return user || null;
  }
}
