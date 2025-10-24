import 'module-alias/register';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('ChatApp API')
    .setDescription('API documentation for subscription-based chat application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  // Raw body only for Stripe webhook route
  app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));

  // Enable CORS for frontend (React Vite dev server)
  app.enableCors({
    origin: 'http://localhost:5173', // your frontend
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
