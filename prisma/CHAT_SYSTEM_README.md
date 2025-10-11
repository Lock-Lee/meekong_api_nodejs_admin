# Chat System - Meekong API

## ภาพรวม (Overview)

ระบบ Chat ของ Meekong รองรับการสนทนาแบบ 3 รูปแบบ:

1. **USER_SHOP** - User คุยกับ Shop (ลูกค้าคุยกับร้านค้า)
2. **USER_ADMIN** - User คุยกับ Admin (ลูกค้าคุยกับผู้ดูแลระบบ)
3. **SHOP_ADMIN** - Shop คุยกับ Admin (ร้านค้าคุยกับผู้ดูแลระบบ)

## โครงสร้างฐานข้อมูล (Database Structure)

### ChatConversation
```typescript
{
  id: string
  type: ChatType // USER_SHOP, USER_ADMIN, SHOP_ADMIN
  userId?: string // ID ของ User (สำหรับ USER_SHOP และ USER_ADMIN)
  shopId?: string // ID ของ Shop (สำหรับ USER_SHOP และ SHOP_ADMIN)
  adminUserId?: string // ID ของ Admin (สำหรับ USER_ADMIN และ SHOP_ADMIN)
  title?: string // หัวข้อแชท
  status: ChatStatus // ACTIVE, ARCHIVED, BLOCKED
  lastMessage?: string // ข้อความล่าสุด
  lastMessageAt?: DateTime
  createdAt: DateTime
  updatedAt: DateTime
}
```

### ChatMessage
```typescript
{
  id: string
  conversationId: string
  senderId: string // ID ของผู้ส่ง (User, Shop, หรือ Admin)
  senderType: ChatSenderType // USER, SHOP, ADMIN
  message: string
  messageType: ChatMessageType // TEXT, IMAGE, PRODUCT, ORDER, REPLY, SYSTEM
  attachments?: string // JSON data สำหรับรูปภาพหรือไฟล์แนบ
  replyToId?: string // ID ของข้อความที่ตอบกลับ
  isRead: boolean
  readAt?: DateTime
  createdAt: DateTime
  updatedAt: DateTime
}
```

## ข้อมูลตัวอย่าง (Sample Data)

ระบบมี seed script ที่สร้างข้อมูลตัวอย่างดังนี้:

### Users
- **buyer@example.com** (user-001) - ผู้ซื้อทั่วไป
- **seller@example.com** (user-002) - เจ้าของร้านค้า
- **admin@example.com** (admin-001) - ผู้ดูแลระบบ

### Shop
- **Best Shop** (shop-001) - ร้านค้าตัวอย่าง

### Conversations
1. **USER_ADMIN** - User คุยกับ Admin เกี่ยวกับปัญหาการสั่งซื้อ
2. **SHOP_ADMIN** - Shop คุยกับ Admin ถามเรื่องค่าคอมมิชชั่น
3. **USER_SHOP** - User คุยกับ Shop สอบถามเกี่ยวกับสินค้า

## วิธีการใช้งาน (Usage)

### 1. Seed ข้อมูลตัวอย่าง
```bash
npx prisma db execute --file prisma/seed-chat-satisfy.sql --schema prisma/schema.prisma
```

### 2. ตรวจสอบข้อมูล
```sql
-- ดู USER_ADMIN conversations
SELECT
    c.id,
    c.type,
    u1.email as user_email,
    u2.email as admin_email,
    c.title,
    c."lastMessage"
FROM "ChatConversation" c
LEFT JOIN "User" u1 ON c."userId" = u1.id
LEFT JOIN "User" u2 ON c."adminUserId" = u2.id
WHERE c.type = 'USER_ADMIN';

-- ดู SHOP_ADMIN conversations
SELECT
    c.id,
    c.type,
    s.name as shop_name,
    u.email as admin_email,
    c.title,
    c."lastMessage"
FROM "ChatConversation" c
LEFT JOIN "Shop" s ON c."shopId" = s.id
LEFT JOIN "User" u ON c."adminUserId" = u.id
WHERE c.type = 'SHOP_ADMIN';

-- ดู USER_SHOP conversations
SELECT
    c.id,
    c.type,
    u.email as user_email,
    s.name as shop_name,
    c.title,
    c."lastMessage"
FROM "ChatConversation" c
LEFT JOIN "User" u ON c."userId" = u.id
LEFT JOIN "Shop" s ON c."shopId" = s.id
WHERE c.type = 'USER_SHOP';

-- ดูข้อความในแต่ละ conversation
SELECT
    m.id,
    m."conversationId",
    m."senderType",
    m.message,
    m."createdAt"
FROM "ChatMessage" m
WHERE m."conversationId" = 'conv-user-admin-001'
ORDER BY m."createdAt" ASC;
```

### 3. ลบข้อมูลตัวอย่าง (Cleanup)
```sql
-- ลบข้อมูล chat ตัวอย่าง
DELETE FROM "ChatMessage" WHERE "conversationId" LIKE 'conv-%';
DELETE FROM "ChatConversation" WHERE id LIKE 'conv-%';

-- ลบข้อมูล user ตัวอย่าง (ถ้าต้องการ)
DELETE FROM "UserProfile" WHERE id LIKE 'profile-%';
DELETE FROM "Shop" WHERE id = 'shop-001';
DELETE FROM "User" WHERE id IN ('user-001', 'user-002', 'admin-001');
```

## API Endpoints

### Chat Service Methods
```typescript
interface IChatService {
  // สร้าง conversation ใหม่
  createConversation(data: {
    type: ChatType;
    userId?: string;
    shopId?: string;
    adminUserId?: string;
    title?: string;
  }): Promise<ChatConversation>;

  // ส่งข้อความ
  sendMessage(data: SendMessageData): Promise<ChatMessage>;

  // ส่งข้อความตอบกลับ
  sendReply(data: SendMessageData): Promise<ChatMessage>;

  // ส่งข้อความพร้อมรูปภาพ
  sendImageMessage(data: SendImageMessageData): Promise<ChatMessage>;

  // ดึงรายการ conversations สำหรับ user
  getConversations(userId: string, keyword?: string): Promise<ChatConversation[]>;

  // ดึงรายการ conversations สำหรับ shop
  getConversationsForShop(shopId: string, keyword?: string): Promise<ChatConversation[]>;

  // ดึงข้อความในแชท
  getMessages(conversationId: string): Promise<ChatMessageWithReply[]>;

  // ทำเครื่องหมายว่าอ่านแล้วสำหรับ user
  markAsRead(conversationId: string, userId: string): Promise<void>;

  // ทำเครื่องหมายว่าอ่านแล้วสำหรับ shop
  markAsReadForShop(conversationId: string, shopId: string): Promise<void>;
}
```

## Socket Events

ระบบ chat ใช้ Socket.IO สำหรับการสื่อสารแบบ real-time:

### Events
- `newMessage` - เมื่อมีข้อความใหม่

### ตัวอย่างการใช้งาน
```typescript
// Client-side
socket.on('newMessage', (message: ChatMessage) => {
  console.log('New message received:', message);
});
```

## การตรวจสอบระบบ (Testing)

### 1. ตรวจสอบว่า Admin สามารถคุยกับ User ได้
```sql
-- หาบทสนทนา USER_ADMIN ทั้งหมด
SELECT
    c.*,
    COUNT(m.id) as total_messages
FROM "ChatConversation" c
LEFT JOIN "ChatMessage" m ON c.id = m."conversationId"
WHERE c.type = 'USER_ADMIN'
GROUP BY c.id;
```

### 2. ตรวจสอบว่า Admin สามารถคุยกับ Shop ได้
```sql
-- หาบทสนทนา SHOP_ADMIN ทั้งหมด
SELECT
    c.*,
    COUNT(m.id) as total_messages
FROM "ChatConversation" c
LEFT JOIN "ChatMessage" m ON c.id = m."conversationId"
WHERE c.type = 'SHOP_ADMIN'
GROUP BY c.id;
```

### 3. ตรวจสอบ unread messages
```sql
-- นับข้อความที่ยังไม่ได้อ่านในแต่ละ conversation
SELECT
    c.id,
    c.type,
    c.title,
    COUNT(m.id) FILTER (WHERE m."isRead" = false) as unread_count
FROM "ChatConversation" c
LEFT JOIN "ChatMessage" m ON c.id = m."conversationId"
WHERE c.id LIKE 'conv-%'
GROUP BY c.id, c.type, c.title;
```

## สรุป (Summary)

✅ ระบบ Chat รองรับการแชทระหว่าง Admin กับ User
✅ ระบบ Chat รองรับการแชทระหว่าง Admin กับ Shop
✅ ระบบ Chat รองรับการแชทระหว่าง User กับ Shop
✅ มีข้อมูลตัวอย่างสำหรับทดสอบระบบ
✅ มี API และ Socket.IO สำหรับ real-time chat
✅ รองรับการส่งข้อความ, รูปภาพ, และการตอบกลับข้อความ

## ไฟล์ที่เกี่ยวข้อง (Related Files)

- [prisma/schema.prisma](prisma/schema.prisma) - Database schema
- [prisma/seed-chat-satisfy.sql](prisma/seed-chat-satisfy.sql) - Seed script
- [src/business/interfaces/chat.interfaces.ts](src/business/interfaces/chat.interfaces.ts) - Interfaces
- [src/business/services/chat.service.ts](src/business/services/chat.service.ts) - Service layer
- [src/data/repositories/chat.repository.ts](src/data/repositories/chat.repository.ts) - Repository layer
- [src/api/controllers/chat.controller.ts](src/api/controllers/chat.controller.ts) - Controller layer
- [src/api/routes/chat.router.ts](src/api/routes/chat.router.ts) - Routes
