# Meekong Chat System Documentation

## ภาพรวม

ระบบ Chat ของ Meekong API ใช้ Socket.IO เพื่อการสื่อสารแบบ real-time ร่วมกับ REST API สำหรับการจัดการข้อมูล chat ระบบรองรับ:

- Real-time messaging
- Group chat (conversations)
- Typing indicators
- Message replies
- Image attachments
- Read receipts
- User join/leave notifications

## Architecture

```
Client (Browser/Mobile App)
    ↓ Socket.IO & HTTP
Express Server + Socket.IO
    ↓
SocketService → ChatRepository → Prisma → Database
```

## Socket.IO Events

### Client → Server Events

1. **authenticate** (Required)
   ```javascript
   socket.emit('authenticate', {
     token: 'jwt-token-here',
     username: 'optional-display-name'
   });
   ```
   - ตรวจสอบ JWT token และเข้าสู่ระบบ
   - รับ response: `authentication_success` หรือ `authentication_error`

2. **add user** (Deprecated - ใช้ authenticate แทน)
   ```javascript
   socket.emit('add user', username);
   ```
   - เข้าร่วม chat system แบบไม่มี authentication
   - รับ response: `login` event

2. **new message**
   ```javascript
   socket.emit('new message', {
     message: "Hello!",
     conversationId: "conversation-id"
   });
   ```
   - ส่งข้อความใหม่

3. **join conversation**
   ```javascript
   socket.emit('join conversation', 'conversation-id');
   ```
   - เข้าร่วม conversation room

4. **leave conversation**
   ```javascript
   socket.emit('leave conversation', 'conversation-id');
   ```
   - ออกจาก conversation room

5. **typing**
   ```javascript
   socket.emit('typing', { conversationId: 'conversation-id' });
   ```
   - แสดง typing indicator

6. **stop typing**
   ```javascript
   socket.emit('stop typing', { conversationId: 'conversation-id' });
   ```
   - หยุด typing indicator

7. **mark as read**
   ```javascript
   socket.emit('mark as read', { conversationId: 'conversation-id' });
   ```
   - ทำเครื่องหมายว่าอ่านแล้ว

### Server → Client Events

1. **authentication_success**
   ```javascript
   socket.on('authentication_success', (data) => {
     console.log('Authenticated:', data.userId, data.username);
   });
   ```

2. **authentication_error**
   ```javascript
   socket.on('authentication_error', (data) => {
     console.error('Auth failed:', data.error);
   });
   ```

3. **login**
   ```javascript
   socket.on('login', (data) => {
     console.log('Users online:', data.numUsers);
   });
   ```

2. **new message**
   ```javascript
   socket.on('new message', (data) => {
     console.log('New message:', data);
     // data: { messageId, username, message, conversationId, timestamp, senderType, messageType, attachments }
   });
   ```

3. **user joined/left**
   ```javascript
   socket.on('user joined', (data) => {
     console.log(data.username + ' joined');
   });
   ```

4. **typing/stop typing**
   ```javascript
   socket.on('typing', (data) => {
     console.log(data.username + ' is typing...');
   });
   ```

## REST API Endpoints

### Base URL: `/api/chat`

1. **Create Conversation**
   ```
   POST /conversations
   Authorization: Bearer {token}
   
   Body:
   {
     "type": "USER_SHOP",
     "shopId": "shop-id",
     "title": "Chat with Shop"
   }
   ```

2. **Send Message**
   ```
   POST /conversations/{conversationId}/messages
   Authorization: Bearer {token}
   
   Body:
   {
     "message": "Hello!",
     "senderId": "user-id",
     "senderType": "USER",
     "messageType": "TEXT"
   }
   ```

3. **Send Reply**
   ```
   POST /conversations/{conversationId}/messages/{messageId}/reply
   Authorization: Bearer {token}
   
   Body:
   {
     "message": "Reply message",
     "senderId": "user-id",
     "senderType": "USER"
   }
   ```

4. **Get Conversations**
   ```
   GET /conversations
   Authorization: Bearer {token}
   ```

5. **Get Messages**
   ```
   GET /conversations/{conversationId}/messages
   Authorization: Bearer {token}
   ```

6. **Send Image Message**
   ```
   POST /conversations/{conversationId}/image
   Authorization: Bearer {token}
   Content-Type: multipart/form-data
   
   Form Data:
   - image: [file]
   - senderId: user-id
   - senderType: USER
   - message: optional caption
   ```

7. **Mark as Read**
   ```
   PUT /conversations/{conversationId}/read
   Authorization: Bearer {token}
   ```

## Database Schema

ระบบใช้ Prisma ORM กับ tables หลัก:

- **ChatConversation**: เก็บข้อมูล conversation
- **ChatMessage**: เก็บข้อความและ metadata
- **User**: ข้อมูลผู้ใช้
- **Shop**: ข้อมูลร้านค้า

## Implementation Details

### SocketService Features

1. **Type Safety**: ใช้ TypeScript interfaces สำหรับ events
2. **Room Management**: จัดการ conversation rooms อัตโนมัติ
3. **User Tracking**: ติดตาม connected users
4. **Error Handling**: จัดการ errors และ disconnections
5. **Logging**: บันทึกทุก action สำหรับ debugging

### ChatRepository Features

1. **Database Integration**: ใช้ Prisma สำหรับ database operations
2. **Validation**: ตรวจสอบ input data
3. **Real-time Sync**: เชื่อมต่อกับ SocketService
4. **File Handling**: จัดการ image uploads
5. **Reply System**: รองรับ nested replies

## การทดสอบ

### With Authentication (Recommended)
1. **เปิดหน้าทดสอบ**: `http://localhost:3000/socket-chat-auth-test.html`
2. **ล็อกอิน**: ใช้ `POST /api/auth/login` เพื่อรับ JWT token
3. **ใส่ token**: วาง JWT token ในช่อง "JWT Token"
4. **คลิก "Authenticate"**: เพื่อยืนยันตัวตน
5. **เลือก conversation ID** และคลิก "Join Conversation"
6. **ส่งข้อความ** เพื่อทดสอบ real-time messaging
7. **เปิดหลายๆ tab** เพื่อทดสอบ multi-user chat

### Without Authentication (Legacy)
1. **เปิดหน้าทดสอบ**: `http://localhost:3000/socket-chat-test.html`
2. **ใส่ username** และคลิก "Join Chat"
3. **เลือก conversation ID** และคลิก "Join Conversation"
4. **ส่งข้อความ** เพื่อทดสอบ real-time messaging

## การ Deploy

1. **Environment Variables**:
   ```
   SOCKET_IO_ORIGINS=https://yourdomain.com,https://yourapp.com
   ```

2. **CORS Configuration**: อัปเดต origins ใน `app.ts`

3. **Load Balancing**: ใช้ Redis adapter สำหรับ multiple server instances:
   ```javascript
   import { createAdapter } from '@socket.io/redis-adapter';
   io.adapter(createAdapter(pubClient, subClient));
   ```

## Best Practices

1. **Authentication**: ใช้ JWT tokens สำหรับ authentication
2. **Rate Limiting**: จำกัดจำนวนข้อความต่อนาที
3. **Message Validation**: ตรวจสอบและ sanitize ข้อความ
4. **Error Handling**: จัดการ connection errors อย่างถูกต้อง
5. **Monitoring**: ติดตาม connection counts และ performance

## Troubleshooting

### Common Issues

1. **Connection Failed**: ตรวจสอบ CORS settings
2. **Messages Not Sending**: ตรวจสอบ authentication และ room membership
3. **Typing Indicators Not Working**: ตรวจสอบ event names และ conversation ID
4. **Images Not Displaying**: ตรวจสอบ file upload settings และ static file serving

### Debug Commands

```javascript
// ตรวจสอบ connection status
socket.connected

// ตรวจสอบ rooms ที่ join
socket.rooms

// ตรวจสอบ events ที่ register
socket.eventNames()
```

## การขยายระบบ

1. **File Sharing**: เพิ่มการส่งไฟล์ประเภทอื่นๆ
2. **Voice Messages**: รองรับ audio messages
3. **Message Reactions**: เพิ่ม emoji reactions
4. **Message Status**: แสดงสถานะ sent/delivered/read
5. **Push Notifications**: แจ้งเตือนผ่าน mobile apps

## API Documentation

สำหรับ API documentation แบบเต็ม ดูได้ที่: `http://localhost:3000/api-docs`