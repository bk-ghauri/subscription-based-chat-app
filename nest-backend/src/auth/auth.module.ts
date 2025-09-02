import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './utils/GoogleStrategy';
import { GoogleAuthGuard } from './utils/Guards';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@app/typeorm/entities/User';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AuthController],
  providers: [
    GoogleStrategy,
    { provide: 'AUTH_SERVICE', useClass: AuthService },
  ],
})
export class AuthModule {}
