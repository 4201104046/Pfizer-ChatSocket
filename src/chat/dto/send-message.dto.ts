// DTO client gửi message lên socket

import { MessageDto } from './message.dto';

export class SendMessageDto {
  roomId: string;
  message: Omit<MessageDto, 'createdAt' | 'status'>;
}
