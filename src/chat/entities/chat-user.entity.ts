// Entity đại diện cho 1 user trong hệ thống chat

export class ChatUserEntity {
  id: string;                  // userId
  name: string;
  avatarUrl?: string;
  type: 'user' | 'oa' | 'admin';
  isActive?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}
