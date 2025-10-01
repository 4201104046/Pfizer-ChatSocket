// Entity lưu trong DB (nếu có persistence)

export class ChatMessageEntity {
  id: number;
  roomId: string;
  senderId: string;
  senderType: 'user' | 'oa' | 'admin';
  text: string;
  attachments?: any[];
  status: 'sent' | 'delivered' | 'read';
  createdAt: Date;
  updatedAt?: Date;
}
