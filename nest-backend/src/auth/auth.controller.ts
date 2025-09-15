import {
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard, LocalAuthGuard, RefreshAuthGuard } from './utils/Guards';
//import type { Request } from 'express';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { CreateUserDto } from '@app/users/dto/create-user.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Create user account and store it in database' })
  @ApiOkResponse({ description: 'Acount created', type: CreateUserDto })
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
    type: LoginResponseDto,
    description: 'User logged in successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
  @UseGuards(LocalAuthGuard)
  async login(@Request() req) {
    return this.authService.login(req.user.id);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Generate new refresh token using refresh token from database',
  })
  @ApiOkResponse({
    description: 'New refresh token generated',
    type: LoginResponseDto,
  })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  @UseGuards(RefreshAuthGuard)
  async refreshToken(@Req() req) {
    return this.authService.refreshToken(req.user.id);
  }

  @Post('signout')
  @ApiOperation({})
  @ApiOkResponse({ description: 'User logged out successfully' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async signOut(@Req() req) {
    this.authService.signOut(req.user.id);
  }
}
