import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RabbitmqService {
  private readonly logger = new Logger(RabbitmqService.name);

  constructor(@Inject('CHAT_PUBLISHER') private readonly client: ClientProxy) {}

  emit(pattern: string, data: any) {
    this.logger.log(`📤 Emit → ${pattern}: ${JSON.stringify(data)}`);
    return this.client.emit(pattern, data);
  }

  send<T>(pattern: string, data: any) {
    this.logger.log(`📤 Send → ${pattern}: ${JSON.stringify(data)}`);
    return this.client.send<T>(pattern, data);
  }
}