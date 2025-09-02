import { Controller, Get, UseGuards } from '@nestjs/common';
import { GoogleAuthGuard } from './utils/Guards';

@Controller('auth')
export class AuthController {
  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  handleGoogleLogin() {
    return { message: 'Google login endpoint' };
  }

  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
  handleGoogleRedirect() {
    return { message: 'Google redirect endpoint' };
  }
}
