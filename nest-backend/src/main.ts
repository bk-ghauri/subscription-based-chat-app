// if (process.env.NODE_ENV === 'production') {
//   require('module-alias/register');
// }

import 'module-alias/register';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.listen(process.env.PORT ?? 3000);

  const app2 = await NestFactory.create(AppModule);
  await app2.listen(3001);
}
bootstrap();
