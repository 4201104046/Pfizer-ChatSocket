// DTO backend (C# hoặc OA webhook) đẩy message vào socket

import { MessageDto } from './message.dto';

export class PushMessageDto {
  roomId: string;
  message: MessageDto;
}
