import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Socket, Server } from 'socket.io';
import { SendMessageDto } from './dto/send-message.dto';
import { PushMessageDto } from './dto/push-message.dto';
import { Adapter } from 'socket.io-adapter';

@Injectable()
export class ChatService {
    private server: Server | null = null;
    private readonly API_BASE =
        process.env.ERP_API_BASE || 'https://api.azicloud.vn/api/v1/erp';
    private readonly CSHARP_SEND_ENDPOINT =
        process.env.C_SHARP_SEND_ENDPOINT || 'http://localhost:5000/api/zalo/send';

    setServer(server: Server) {
        this.server = server;
    }

    // Auth via ERP C# endpoint and join rooms
    async handleAuthAndJoin(socket: Socket) {
        try {
            const token =
                (socket.handshake.headers['authorization'] as string) ||
                socket.handshake.auth?.token;
            if (!token) {
                return socket.disconnect();
            }

            const res = await axios.get(`${this.API_BASE}/socket/connection`, {
                headers: { Authorization: token },
            });
            if (res.status !== 200 || !res.data?.result) {
                return socket.disconnect();
            }

            const data = res.data.result;
            if (!data.user_id) {
                return socket.disconnect();
            }

            const userId = data.user_id;
            socket.data.user_id = userId;
            socket.join(`user.${userId}`);
            socket.broadcast.emit('connected_users', [userId]);

            if (Array.isArray(data.room_list)) {
                data.room_list.forEach((room: string) => socket.join(room));
            }

            // emit current connected user list (rooms)
            if (this.server) {
                const rooms = this.getUserRooms();
                socket.emit('connected_users', rooms);
            }
        } catch (e) {
            return socket.disconnect();
        }
    }

    async handleDisconnect(socket: Socket) {
        if (!this.server) return;

        const adapter = this.server.adapter as unknown as Adapter;
        const rooms = adapter.rooms;
        const userRoom = `user.${socket.data.user_id}`;

        if (!rooms.has(userRoom)) {
            socket.broadcast.emit('disconnected_users', [socket.data.user_id]);
        }
    }

    // Generic room message forwarding -> call ERP API to persist & optionally trigger OA
    async handleRoomMessage(socket: Socket, data: any) {
        if (!this.server) return;
        try {
            const token =
                (socket.handshake.headers['authorization'] as string) ||
                socket.handshake.auth?.token;
            if (!token) return socket.disconnect();

            const res = await axios.post(
                `${this.API_BASE}/web/chat/room/message/send`,
                data,
                { headers: { Authorization: token } },
            );

            if (res.status === 200) {
                if (res.data?.success && res.data.result?.id) {
                    data.message.id = res.data.result.id;
                }
                this.server.to(`${data.room_id}`).emit('room_message', data);
            } else {
                socket.disconnect();
            }
        } catch {
            socket.disconnect();
        }
    }

    // Facebook room message
    async handleFbMessage(socket: Socket, data: any) {
        if (!this.server) return;
        try {
            const token =
                (socket.handshake.headers['authorization'] as string) ||
                socket.handshake.auth?.token;
            if (!token) return socket.disconnect();

            const res = await axios.post(
                `${this.API_BASE}/web/chat/room/facebook/message/send`,
                data,
                { headers: { Authorization: token } },
            );
            if (res.status === 200) {
                if (res.data?.success && res.data.result?.id) {
                    data.message.id = res.data.result.id;
                }
                this.server.to(`${data.room_id}`).emit('room_message', data);
            } else {
                socket.disconnect();
            }
        } catch {
            socket.disconnect();
        }
    }

    // Admin sends OA message -> we forward to C# backend to actually call Zalo OA API
    async handleOaMessage(socket: Socket, dto: SendMessageDto) {
        if (!this.server) return;
        try {
            const token =
                (socket.handshake.headers['authorization'] as string) ||
                socket.handshake.auth?.token;
            const payload = {
                tenant_id: 1,
                customapp_id: 17,
                lang_id: 1,
                roomId: dto.roomId,
                SenderId: dto.message.senderId,
                type: dto.message.type,
                content: dto.message.content
            };

            const res = await axios.post(
                'https://api.azidev.com/api/v1/custom-app/zalo-crm/chat/send',
                payload,
                { headers: { 'Content-Type': 'application/json' } },
            );

            console.log('OA send response:', res.data);

            // optimistic emit to room so admins see it immediately
            this.server.to(dto.roomId).emit('room_message', {
                ...dto.message,
                status: 'sent',
            });
        } catch (e) {
            console.error('handleOaMessage error:', e.message);
            socket.disconnect();
        }
    }

    // Client hoặc Admin gửi message thường (không phải OA riêng)
    async handleSendMessage(socket: Socket, dto: SendMessageDto) {
        if (!this.server) return;

        try {
            const token =
                (socket.handshake.headers['authorization'] as string) ||
                socket.handshake.auth?.token;
            if (!token) {
                socket.disconnect();
                return;
            }

            const res = await axios.post(
                this.CSHARP_SEND_ENDPOINT.replace('/zalo/send', '/chat/send'),
                {
                    roomId: dto.roomId,
                    senderId: dto.message.senderId,
                    text: dto.message.content,
                    attachments: dto.message.attachments,
                },
                { headers: { Authorization: token } },
            );

            this.server.to(dto.roomId).emit('room_message', {
                ...dto.message,
                id: res.data?.id || undefined,
                status: 'sent',
                createdAt: new Date(),
            });
        } catch (e) {
            console.error('handleSendMessage error:', e.message);
            socket.disconnect();
        }
    }

    // Called by C# backend when webhook processed (OA inbound).
    async pushOaInbound(roomId: string, payload: any) {
        if (!this.server) return;
        console.log('pushOaInbound', roomId, JSON.stringify(payload));
        this.server.to(roomId).emit('room_message', payload);
    }

    getUserRooms(): string[] {
        if (!this.server) return [];
        const adapter = this.server.adapter as unknown as Adapter;
        const rooms = adapter.rooms;
        const userRooms: string[] = [];

        if (!rooms || rooms.size === 0) return [];

        for (const r of rooms.keys()) {
            if (r.startsWith('user.')) {
                userRooms.push(r);
            }
        }
        return userRooms;
    }
}
