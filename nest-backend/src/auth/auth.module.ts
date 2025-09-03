import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './utils/GoogleStrategy';
import { GoogleAuthGuard } from './utils/Guards';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@app/typeorm/entities/User';
import { SessionSerializer } from './utils/Serializer';
import { LocalStrategy } from './utils/LocalStrategy';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './utils/JwtStrategy';
import { config } from 'process';
import refreshJwtConfig from './config/refresh-jwt.config';
import { RefreshJwtStrategy } from './utils/RefreshStrategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(refreshJwtConfig),
    ConfigModule.forFeature(jwtConfig),
  ],
  controllers: [AuthController],
  providers: [
    GoogleStrategy,
    LocalStrategy,
    SessionSerializer,
    RefreshJwtStrategy,
    JwtStrategy
    { provide: 'AUTH_SERVICE', useClass: AuthService },
  ],
})
export class AuthModule {}
