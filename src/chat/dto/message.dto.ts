// Object chat chung (cả inbound/outbound dùng chung)

export class MessageDto {
  id?: number;                // id trong DB (nếu có)
  roomId: string;             // phòng chat (OA / User / Group)
  senderId: string;           // id của người gửi (userId, oaId, adminId)
  senderType: 'user' | 'oa' | 'admin';
  text: string;
  attachments?: any[];        // file, ảnh, video...
  status?: 'sent' | 'delivered' | 'read';
  createdAt?: Date;
}
