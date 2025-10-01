import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { PushMessageDto } from './dto/push-message.dto';

@WebSocketGateway({
  namespace: '/erp-aziworld',
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly chatService: ChatService) {}

  afterInit() {
    this.chatService.setServer(this.server);
    console.log('✅ ChatGateway initialized');
  }

  async handleConnection(socket: Socket) {
    console.log('⚡ client connected', socket.id);
    // Authenticate and join rooms
    // await this.chatService.handleAuthAndJoin(socket);
  }

  async handleDisconnect(socket: Socket) {
    console.log('❌ client disconnected', socket.id);
    await this.chatService.handleDisconnect(socket);
  }

  // Admin / Client gửi message -> forward to C# and broadcast
  @SubscribeMessage('send_message')
  async onSendMessage(@MessageBody() data: SendMessageDto, @ConnectedSocket() socket: Socket) {
      console.log("emit send_message")
    return this.chatService.handleSendMessage(socket, data);
  }

  // Room generic message (backwards compat)
  @SubscribeMessage('room_message')
  async onRoomMessage(@MessageBody() data: any, @ConnectedSocket() socket: Socket) {
    return this.chatService.handleRoomMessage(socket, data);
  }

  // Facebook message channel
  @SubscribeMessage('room_facebook_message')
  async onFbMessage(@MessageBody() data: any, @ConnectedSocket() socket: Socket) {
    return this.chatService.handleFbMessage(socket, data);
  }

  // OA-specific send from admin -> forward to backend C# to actually call Zalo OA API
  @SubscribeMessage('room_oa_message')
  async onOaMessage(@MessageBody() data: SendMessageDto, @ConnectedSocket() socket: Socket) {
    return this.chatService.handleOaMessage(socket, data);
  }

  // Utility passthroughs preserved from legacy
  @SubscribeMessage('to_room_event')
  onToRoomEvent(@MessageBody() d: any) {
    this.server.to(`${d.room_id}`).emit(d.event_name, d.body);
  }

  @SubscribeMessage('in_room_event')
  onInRoomEvent(@MessageBody() d: any) {
    this.server.in(`${d.room_id}`).emit(d.event_name, d.body);
  }

  @SubscribeMessage('to_user_event')
  onToUserEvent(@MessageBody() d: any) {
    this.server.to(`user.${d.user_id}`).emit(d.event_name, d.body);
  }

  @SubscribeMessage('in_user_event')
  onInUserEvent(@MessageBody() d: any) {
    this.server.in(`user.${d.user_id}`).emit(d.event_name, d.body);
  }

  @SubscribeMessage('user_join_room')
  onUserJoinRoom(@MessageBody() d: any) {
    this.server.in(`user.${d.user_id}`).socketsJoin(`${d.room_id}`);
  }

  @SubscribeMessage('user_leave_room')
  onUserLeaveRoom(@MessageBody() d: any) {
    this.server.in(`user.${d.user_id}`).socketsLeave(`${d.room_id}`);
  }

  @SubscribeMessage('room_user_list')
  onRoomUserList(@MessageBody() d: any, @ConnectedSocket() s: Socket) {
    if (d?.user_list) {
      d.user_list.forEach((u: any) => this.server.in(`user.${u.user_id}`).socketsJoin(`${d.room_id}`));
      s.broadcast.to(`${d.room_id}`).emit('room_user_list', d);
    }
    if (d?.user_delete_list) {
      d.user_delete_list.forEach((u: any) => this.server.in(`user.${u.user_id}`).socketsLeave(`${d.room_id}`));
    }
  }

  @SubscribeMessage('crm_lead_invite_accept')
  onCrmLeadAccept(@MessageBody() d: any, @ConnectedSocket() s: Socket) {
    if (d?.user_id && d?.room_id) {
      this.server.in(`user.${d.user_id}`).socketsJoin(`${d.room_id}`);
      s.broadcast.to(`${d.room_id}`).emit('crm_lead_invite_accept', d);
    }
  }

  @SubscribeMessage('room_total_read')
  onRoomTotalRead(@MessageBody() d: any, @ConnectedSocket() s: Socket) {
    if (d?.room_id && d?.is_read !== undefined) {
      s.broadcast.to(`${d.room_id}`).emit('room_total_read', d);
    }
  }
}
