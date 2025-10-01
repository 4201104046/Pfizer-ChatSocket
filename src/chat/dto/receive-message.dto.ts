// DTO client nhận về từ socket (server emit xuống)

import { MessageDto } from './message.dto';

export class ReceiveMessageDto extends MessageDto {
  // ở đây có thể thêm field extra nếu cần
  // ví dụ: isMine để frontend highlight
  isMine?: boolean;
}
