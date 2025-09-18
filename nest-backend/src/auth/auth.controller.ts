import { Controller, Post, UseGuards, Body, HttpCode } from '@nestjs/common';
import { JwtAuthGuard, LocalAuthGuard, RefreshAuthGuard } from './utils/Guards';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { CreateUserDto } from '@app/users/dto/create-user.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginResponseObject } from './dto/login-response';
import { LoginDto } from './dto/login.dto';
import { UserId } from '@app/common/decorators/user-id.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Create user account and store it in database' })
  @ApiOkResponse({ description: 'Account created', type: CreateUserDto })
  @ApiBadRequestResponse({
    description: 'An account already exists with this email or display name',
  })
  async signup(@Body() createUserDto: CreateUserDto) {
    return this.authService.signup(createUserDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    type: LoginResponseObject,
    description: 'User logged in successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
  @UseGuards(LocalAuthGuard)
  async login(@UserId() userId: string) {
    return this.authService.login(userId);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Generate new refresh token using refresh token from database',
  })
  @ApiOkResponse({
    description: 'New refresh token generated',
    type: LoginResponseObject,
  })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  @UseGuards(RefreshAuthGuard)
  async refreshToken(@UserId() userId: string) {
    return this.authService.refreshToken(userId);
  }

  @Post('signout')
  @HttpCode(204)
  @ApiOperation({})
  @ApiNoContentResponse({ description: 'User logged out successfully' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async signOut(@UserId() userId: string) {
    this.authService.signOut(userId);
  }
}
