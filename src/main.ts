import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta campos que não estão no DTO
      transform: true, // converte query params (ex.: tecnicoId=2 vira número)
    }),
  );

  await app.listen(Number(process.env.PORT) || 3000);
}
bootstrap();
