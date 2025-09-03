// if (process.env.NODE_ENV === 'production') {
//   require('module-alias/register');
// }

import 'module-alias/register';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@app/app.module';
import session from 'express-session';
import * as passport from 'passport';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    session({
      secret: 'ifwnenvpevnpfifffoe',
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 3600000 },
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
