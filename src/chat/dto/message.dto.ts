// Object chat chung (cả inbound/outbound dùng chung)

export class MessageDto {
   id?: number;
  roomId: string;
  senderId: string;
  senderType: 'user' | 'oa' | 'admin';
  type: 'text' | 'image' | 'file';
  content: string;            // text hoặc URL ảnh/file
  attachments?: any[];        // optional nếu type = file
  status?: 'sent' | 'delivered' | 'read';
  createdAt?: Date;
}
