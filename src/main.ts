import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Cho phép CORS để webapp connect socket
  await app.listen(process.env.PORT || 3000); // Dùng PORT từ Render
}
bootstrap();
