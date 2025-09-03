import {
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  GoogleAuthGuard,
  LocalAuthGuard,
  RefreshAuthGuard,
} from './utils/Guards';
//import type { Request } from 'express';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user.id);
  }

  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  refreshToken(@Req() req) {
    return this.authService.refreshToken(req.user.id);
  }

  @Public()
  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  handleGoogleLogin() {
    return { message: 'Google login endpoint' };
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  handleGoogleCallback(@Req() request) {
    const response = await this.authService.login(request.user.id);
    return { message: 'Google redirect endpoint' };
  }

  @Get('status')
  user(@Req() request: Request) {
    console.log('Request user:', request.user);
    if (request.user) {
      return { msg: 'Authenticated' };
    } else {
      return { msg: 'Not Authenticated' };
    }
  }
}
