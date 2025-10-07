import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from '../services/chat.service';
import { MessageDto } from '../dto/message.dto';
import request from 'supertest';

describe('ChatController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [ChatService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init(); // 🔑 cần init thì app mới chạy được
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    const controller = app.get<ChatController>(ChatController);
    expect(controller).toBeDefined();
  });

  it('/chat/ping (POST)', () => {
    return request(app.getHttpServer())
      .post('/chat/ping')
      .send({ msg: 'hello' })
      .expect(201)
      .expect({ ok: true, body: { msg: 'hello' } });
  });

  it('/chat/push (POST)', () => {
    const msg: MessageDto = {
    roomId: 'room2',
    senderId: 'u1',
    senderType: 'user',
    type: 'text',
    content: 'hi',
    status: 'sent',
    createdAt: new Date(),
  };
    return request(app.getHttpServer())
      .post('/chat/push')
      .send({ roomId: msg.roomId, message: msg })
      .expect(201)
      .expect({ ok: true });
  });
});
