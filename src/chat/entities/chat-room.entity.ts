// Entity đại diện cho 1 room chat

export class ChatRoomEntity {
  id: string;                   // roomId
  name?: string;                // tên group/room
  type: 'private' | 'group' | 'oa';  // loại phòng
  participants: string[];       // list userId / oaId
  createdAt: Date;
  updatedAt?: Date;
}
