// src/redis/redis.module.ts
import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global() // ✅ Cho phép dùng ở mọi nơi mà không cần import lại
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}