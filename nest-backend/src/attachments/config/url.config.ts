import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export default registerAs(
  'url',
  (): JwtModuleOptions => ({
    secret: process.env.ATTACHMENT_JWT_SECRET,
    signOptions: {
      expiresIn: process.env.ATTACHMENT_URL_EXPIRES_IN,
    },
  }),
);
