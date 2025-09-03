import { User } from '@app/typeorm/entities/User';
import { PassportSerializer } from '@nestjs/passport';
import { deserializeUser, serializeUser } from 'passport';
import { AuthService } from '../auth.service';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: AuthService,
  ) {
    super();
  }

  serializeUser(user: User, done: Function) {
    console.log('Serializing user:');
    done(null, user);
  }

  async deserializeUser(payload: any, done: Function) {
    const user = await this.authService.findUser(payload.id);
    console.log('Deserialized user:', user);
    return user ? done(null, user) : done(null, null);
  }
}
