import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Bật CORS để Frontend Next.js gọi được API
  app.enableCors();

  // Chạy trên cổng 4000 (để cổng 3000 cho Frontend)
  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`Backend is running on: http://localhost:${port}`);
}
void bootstrap();
