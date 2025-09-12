import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@app/users/entities/user.entity';
import { LocalStrategy } from './utils/LocalStrategy';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './utils/JwtStrategy';
import refreshJwtConfig from './config/refresh-jwt.config';
import { RefreshJwtStrategy } from './utils/RefreshStrategy';
import { UserService } from '@app/users/users.service';
import { AccountType } from '@app/account-type/entities/account-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AccountType]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(refreshJwtConfig),
    ConfigModule.forFeature(jwtConfig),
  ],
  controllers: [AuthController],
  providers: [
    LocalStrategy,
    RefreshJwtStrategy,
    JwtStrategy,
    AuthService,
    UserService,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
