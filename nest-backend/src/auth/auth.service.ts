import { UsersService } from '@app/users/users.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import refreshJwtConfig from './config/refresh-jwt.config';
import * as config from '@nestjs/config';
import { AuthJwtPayload } from '@app/auth/types/auth-jwtPayload';
import * as argon2 from 'argon2';
import { CreateUserDto } from '@app/users/dto/create-user.dto';
import { LoginResponseObject } from '@app/auth/dto/login-response';
import { ErrorMessages } from '@app/common/strings/error-messages';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    // private jwtService: JwtService,
    // @Inject(refreshJwtConfig.KEY)
    // private refreshTokenConfig: config.ConfigType<typeof refreshJwtConfig>,

    private readonly tokenService: TokenService,
  ) {}

  async signup(createUserDto: CreateUserDto) {
    // Check if user already exists
    const existingUser = await this.userService.findByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw new BadRequestException(ErrorMessages.EMAIL_EXISTS);
    }

    const existingDisplayName = await this.userService.findByDisplayName(
      createUserDto.displayName,
    );
    if (existingDisplayName) {
      throw new BadRequestException(ErrorMessages.DISPLAY_NAME_TAKEN);
    }

    const newUser = await this.userService.create({
      ...createUserDto,
    });

    // Auto-login (return tokens)
    const { accessToken, refreshToken } =
      await this.tokenService.generateTokens(newUser.id);
    const hashedRefreshToken = await this.hashString(refreshToken);
    await this.userService.updateHashedRefreshToken({
      userId: newUser.id,
      hashedRefreshToken,
    });

    return {
      id: newUser.id,
      accessToken,
      refreshToken,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmailWithPassword(email);
    if (!user) throw new UnauthorizedException(ErrorMessages.USER_NOT_FOUND);
    const isPasswordMatch = await this.comparePassword(password, user.password);
    if (!isPasswordMatch)
      throw new UnauthorizedException(ErrorMessages.INVALID_CREDENTIALS);

    return { id: user.id };
  }

  async login(userId: string) {
    const { accessToken, refreshToken } =
      await this.tokenService.generateTokens(userId);
    const hashedRefreshToken = await this.hashString(refreshToken);
    await this.userService.updateHashedRefreshToken({
      userId,
      hashedRefreshToken,
    });
    const response: LoginResponseObject = {
      userId,
      accessToken,
      refreshToken,
    };

    return response;
  }

  // async generateTokens(userId: string) {
  //   const payload: AuthJwtPayload = { userId };
  //   const [accessToken, refreshToken] = await Promise.all([
  //     this.jwtService.signAsync(payload),
  //     this.jwtService.signAsync(payload, this.refreshTokenConfig),
  //   ]);
  //   return {
  //     accessToken,
  //     refreshToken,
  //   };
  // }

  async refreshToken(userId: string) {
    const { accessToken, refreshToken } =
      await this.tokenService.generateTokens(userId);
    const hashedRefreshToken = await this.hashString(refreshToken);
    await this.userService.updateHashedRefreshToken({
      userId,
      hashedRefreshToken,
    });
    const response: LoginResponseObject = {
      userId,
      accessToken,
      refreshToken,
    };
    return response;
  }

  async validateRefreshToken(userId: string, refreshToken: string) {
    const user = await this.userService.findOne(userId);
    if (!user || !user.hashedRefreshToken)
      throw new UnauthorizedException(ErrorMessages.INVALID_REQUEST);

    const refreshTokenMatches = await this.verifyHashMatch(
      user.hashedRefreshToken,
      refreshToken,
    );

    if (!refreshTokenMatches)
      throw new UnauthorizedException(ErrorMessages.INVALID_TOKEN);

    return { id: userId };
  }

  async signOut(userId: string) {
    await this.userService.updateHashedRefreshToken({
      userId,
      hashedRefreshToken: null,
    });
  }

  async validateJwtUser(userId: string) {
    const user = await this.userService.findOne(userId);
    if (!user) throw new UnauthorizedException(ErrorMessages.USER_NOT_FOUND);
    return { id: user.id };
  }

  async hashString(plainString: string) {
    return await argon2.hash(plainString);
  }

  async verifyHashMatch(hashedString: string, plainString: string) {
    return await argon2.verify(hashedString, plainString);
  }

  async comparePassword(
    providedPassword: string,
    actualPassword: string,
  ): Promise<boolean> {
    return await compare(providedPassword, actualPassword);
  }
}
