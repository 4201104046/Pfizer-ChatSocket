import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from '../services/chat.service';
import { PushMessageDto } from '../dto/push-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // C# calls this after processing Zalo webhook inbound
  @Post('push')
  async pushMessage(@Body() dto: PushMessageDto) {
    await this.chatService.pushOaInbound(dto.roomId, dto.message);
    return { ok: true };
  }

  // optional health/test endpoint
  @Post('ping')
  ping(@Body() b: any) {
    return { ok: true, body: b };
  }
}
