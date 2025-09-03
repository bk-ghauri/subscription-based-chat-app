import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { Inject, Injectable } from '@nestjs/common';
import { Auth } from 'firebase-admin/auth';
import { AuthService } from '../auth.service';
import { CreateUserDto } from '@app/users/dto/create-user.dto';

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

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    console.log('Google profile:', profile);

    if (!profile.emails?.length) {
      throw new Error('Google account has no email associated');
    }

    const dto: CreateUserDto = {
      email: profile.emails?.[0].value,
      display_name: profile.displayName,
      google_id: profile.id,
      avatar_url: profile.photos?.[0]?.value,
    };

    const user = await this.authService.validateGoogleUser(dto);
    console.log('Validated user:', user);
    done(null, user);
  }
}
