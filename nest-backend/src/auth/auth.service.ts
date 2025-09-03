import { User } from '@app/typeorm/entities/User';
import { CreateUserDto } from '@app/users/dto/create-user.dto';
import { UserService } from '@app/users/users.service';
import { GoogleUserDetails } from '@app/utils/types';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare } from 'bcrypt';
import { Repository } from 'typeorm';
import refreshJwtConfig from './config/refresh-jwt.config';
import * as config from '@nestjs/config';
import { AuthJwtPayload } from './types/auth-jwtPayload';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private userService: UserService,
    private jwtService: JwtService,
    @Inject(refreshJwtConfig.KEY)
    private refreshTokenConfig: config.ConfigType<typeof refreshJwtConfig>,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('User not found!');
    const isPasswordMatch = await compare(password, user.password);
    if (!isPasswordMatch)
      throw new UnauthorizedException('Invalid credentials');

    return { id: user.user_id };
  }

  async login(userId: string) {
    // const payload: AuthJwtPayload = { sub: userId };
    // const token = this.jwtService.sign(payload);
    // const refreshToken = this.jwtService.sign(payload, this.refreshTokenConfig);
    const { accessToken, refreshToken } = await this.generateTokens(userId);
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.userService.updateHashedRefreshToken(userId, hashedRefreshToken);
    return {
      id: userId,
      accessToken,
      refreshToken,
    };
  }

  async generateTokens(userId: string) {
    const payload: AuthJwtPayload = { sub: userId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, this.refreshTokenConfig),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(userId: string) {
    const { accessToken, refreshToken } = await this.generateTokens(userId);
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.userService.updateHashedRefreshToken(userId, hashedRefreshToken);
    return {
      id: userId,
      accessToken,
      refreshToken,
    };
  }

  async validateRefreshToken(userId: string, refreshToken: string) {
    const user = await this.userService.findOne(userId);
    if (!user || !user.hashed_refresh_token)
      throw new UnauthorizedException('Invalid Refresh Token');

    const refreshTokenMatches = await argon2.verify(
      user.hashed_refresh_token,
      refreshToken,
    );
    if (!refreshTokenMatches)
      throw new UnauthorizedException('Invalid Refresh Token');

    return { id: userId };
  }

  async validateGoogleUser(dto: CreateUserDto): Promise<User> {
    console.log('Validating user with details:', dto);

    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) return existing;

    console.log('User not found, creating new user:');
    const newUser = this.userRepository.create(dto);
    return this.userRepository.save(newUser);
  }

  async findUser(user_id: string) {
    const user = await this.userRepository.findOneBy({ user_id });
    return user;
  }
}
