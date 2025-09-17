import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalStrategy } from './utils/LocalStrategy';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './utils/JwtStrategy';
import refreshJwtConfig from './config/refresh-jwt.config';
import { RefreshJwtStrategy } from './utils/RefreshStrategy';
import { UsersModule } from '@app/users/users.module';

@Module({
  imports: [
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(refreshJwtConfig),
    ConfigModule.forFeature(jwtConfig),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [LocalStrategy, RefreshJwtStrategy, JwtStrategy, AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
