import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Global validation pipe — tự động validate DTO với class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // Loại bỏ các field không khai báo trong DTO
      forbidNonWhitelisted: true,
      transform: true,        // Tự động chuyển đổi kiểu dữ liệu
    }),
  );

  // Bật CORS để Frontend Next.js gọi được API
  app.enableCors();

  // Prefix toàn bộ API với /api
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  logger.log(`🚀 API is running on: http://localhost:${port}/api`);
}
void bootstrap();
