# Meekong Socket.IO API Documentation

**Version:** 1.0.0  
**Server:** http://localhost:3000  

Real-time Socket.IO events for the Meekong API

## Authentication

**Required:** Yes  
**Type:** JWT Bearer Token  

Client must authenticate using JWT token before using other events

```javascript
authenticate
{
  "token": "your-jwt-token-here",
  "username": "optional-display-name"
}
```

## Client → Server Events

### authenticate

Authenticate user with JWT token (Required)

**Payload:**
```javascript
{
  "token": "string (required) - JWT access token",
  "username": "string (optional) - Display name for the user"
}
```


**Example:**
```javascript
socket.emit('authenticate', {
  token: 'eyJhbGciOiJIUzI1NiIs...',
  username: 'John Doe'
});
```

---

### new_message

Send a new message to a conversation

**Payload:**
```javascript
{
  "message": "string (required) - Message content",
  "conversationId": "string (required) - Conversation ID"
}
```

**Authentication:** Required  
**Broadcasts:** new_message event to all users in conversation room  

**Example:**
```javascript
socket.emit('new_message', {
  message: 'Hello!',
  conversationId: 'conv-123-456'
});
```

---

### join_conversation

Join a conversation room to receive real-time messages

**Payload:**
```javascript
conversationId: string
```

**Authentication:** Required  
**Broadcasts:** conversation_joined to other users in room  

**Example:**
```javascript
socket.emit('join_conversation', 'conv-123-456');
```

---

### leave_conversation

Leave a conversation room

**Payload:**
```javascript
conversationId: string
```

**Authentication:** Required  
**Broadcasts:** conversation_left to other users in room  

**Example:**
```javascript
socket.emit('leave_conversation', 'conv-123-456');
```

---

### typing

Indicate user is typing in a conversation

**Payload:**
```javascript
{
  "conversationId": "string (required)"
}
```

**Authentication:** Required  
**Broadcasts:** typing event to other users in conversation  

**Example:**
```javascript
socket.emit('typing', { conversationId: 'conv-123-456' });
```

---

### stop_typing

Indicate user stopped typing

**Payload:**
```javascript
{
  "conversationId": "string (required)"
}
```

**Authentication:** Required  
**Broadcasts:** stop_typing event to other users in conversation  

**Example:**
```javascript
socket.emit('stop_typing', { conversationId: 'conv-123-456' });
```

---

### mark_as_read

Mark all messages in a conversation as read

**Payload:**
```javascript
{
  "conversationId": "string (required)"
}
```

**Authentication:** Required  
**Broadcasts:** message_read to other users, unread_count_updated to sender  

**Example:**
```javascript
socket.emit('mark_as_read', { conversationId: 'conv-123-456' });
```

---

### get_conversation_list

Request list of all user's conversations

**Payload:**
```javascript
none
```

**Authentication:** Required  
**Response:** conversation_list_updated  

**Example:**
```javascript
socket.emit('get_conversation_list');
```

---

### get_unread_count

Request unread message count for a conversation

**Payload:**
```javascript
{
  "conversationId": "string (required)"
}
```

**Authentication:** Required  
**Response:** unread_count_updated  

**Example:**
```javascript
socket.emit('get_unread_count', { conversationId: 'conv-123-456' });
```

---

### satisfy_join_item

Join item room to receive satisfy/negotiation count updates

**Payload:**
```javascript
itemId: string
```

**Authentication:** Optional  
**Broadcasts:** satisfy_count_update when count changes  

**Example:**
```javascript
socket.emit('satisfy_join_item', 'item-123-456');
```

---

### satisfy_leave_item

Leave item room

**Payload:**
```javascript
itemId: string
```

**Authentication:** Optional  

**Example:**
```javascript
socket.emit('satisfy_leave_item', 'item-123-456');
```

---

### add_user ⚠️ DEPRECATED

DEPRECATED: Legacy authentication method (use 'authenticate' instead)

**Payload:**
```javascript
username: string
```

**Response:** login  
---

## Server → Client Events

### authentication_success

Authentication successful

**Payload:**
```javascript
{
  "userId": "string - Authenticated user ID",
  "username": "string - Display name"
}
```

**Example:**
```javascript
socket.on('authentication_success', (data) => {
  console.log('Authenticated as:', data.username);
  console.log('User ID:', data.userId);
});
```

---

### authentication_error

Authentication failed

**Payload:**
```javascript
{
  "error": "string - Error message"
}
```

**Example:**
```javascript
socket.on('authentication_error', (data) => {
  console.error('Auth failed:', data.error);
});
```

---

### new_message

New message received in conversation

**Payload:**
```javascript
{
  "messageId": "string - Message ID",
  "username": "string - Sender's display name",
  "senderId": "string - Sender's user ID",
  "message": "string - Message content",
  "conversationId": "string - Conversation ID",
  "timestamp": "string (ISO 8601) - Message timestamp",
  "senderType": "string - USER or SHOP",
  "messageType": "string - TEXT or IMAGE",
  "attachments": "string (optional) - Attachment URLs",
  "replyTo": "object (optional) - Referenced message if this is a reply"
}
```

**Example:**
```javascript
socket.on('new_message', (data) => {
  console.log(data.username + ': ' + data.message);
  displayMessage(data);
});
```

---

### conversation_joined

User joined conversation

**Payload:**
```javascript
{
  "conversationId": "string",
  "username": "string"
}
```

**Example:**
```javascript
socket.on('conversation_joined', (data) => {
  console.log(data.username + ' joined conversation');
});
```

---

### conversation_left

User left conversation

**Payload:**
```javascript
{
  "conversationId": "string",
  "username": "string"
}
```

**Example:**
```javascript
socket.on('conversation_left', (data) => {
  console.log(data.username + ' left conversation');
});
```

---

### typing

User is typing

**Payload:**
```javascript
{
  "username": "string",
  "conversationId": "string"
}
```

**Example:**
```javascript
socket.on('typing', (data) => {
  showTypingIndicator(data.username);
});
```

---

### stop_typing

User stopped typing

**Payload:**
```javascript
{
  "username": "string",
  "conversationId": "string"
}
```

**Example:**
```javascript
socket.on('stop_typing', (data) => {
  hideTypingIndicator(data.username);
});
```

---

### message_read

Messages were marked as read by a user

**Payload:**
```javascript
{
  "conversationId": "string",
  "userId": "string - User who read the messages"
}
```

**Example:**
```javascript
socket.on('message_read', (data) => {
  updateReadStatus(data.conversationId, data.userId);
});
```

---

### unread_count_updated

Unread message count updated

**Payload:**
```javascript
{
  "conversationId": "string",
  "unreadCount": "number",
  "lastMessage": "string (optional) - Preview of last message",
  "lastMessageTime": "string (optional, ISO 8601) - Timestamp of last message"
}
```

**Example:**
```javascript
socket.on('unread_count_updated', (data) => {
  updateBadge(data.conversationId, data.unreadCount);
});
```

---

### conversation_list_updated

Conversation list with metadata

**Payload:**
```javascript
{
  "conversations": "array - List of conversation objects with id, name, lastMessage, lastMessageTime, unreadCount, participants"
}
```

**Example:**
```javascript
socket.on('conversation_list_updated', (data) => {
  renderConversationList(data.conversations);
});
```

---

### satisfy_count_update

Satisfy/negotiation participant count updated for an item

**Payload:**
```javascript
{
  "itemId": "string - Item ID",
  "count": "number - Current participant count"
}
```

**Example:**
```javascript
socket.on('satisfy_count_update', (data) => {
  updateItemCount(data.itemId, data.count);
});
```

---

### user_joined ⚠️ DEPRECATED

DEPRECATED: Legacy event (user joined chat)

**Payload:**
```javascript
{
  "username": "string",
  "numUsers": "number"
}
```

---

### user_left ⚠️ DEPRECATED

DEPRECATED: Legacy event (user left chat)

**Payload:**
```javascript
{
  "username": "string",
  "numUsers": "number"
}
```

---

### login ⚠️ DEPRECATED

DEPRECATED: Legacy login event

**Payload:**
```javascript
{
  "numUsers": "number"
}
```

---

## Connection Example

```javascript
// Connect to Socket.IO server
const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

// Authenticate
socket.emit('authenticate', {
  token: 'your-jwt-token',
  username: 'John Doe'
});

// Listen for authentication result
socket.on('authentication_success', (data) => {
  console.log('Authenticated:', data.userId);

  // Join a conversation
  socket.emit('join_conversation', 'conv-123-456');
});

socket.on('authentication_error', (data) => {
  console.error('Auth failed:', data.error);
});

// Listen for new messages
socket.on('new_message', (data) => {
  console.log('New message:', data.message);
  displayMessage(data);
});

// Send a message
function sendMessage(message, conversationId) {
  socket.emit('new_message', { message, conversationId });
}

// Show typing indicator
function showTyping(conversationId) {
  socket.emit('typing', { conversationId });

  // Auto-stop typing after 3 seconds
  setTimeout(() => {
    socket.emit('stop_typing', { conversationId });
  }, 3000);
}
```

## Testing Guide

### With Authentication (Recommended)

**URL:** http://localhost:3000/socket-chat-auth-test.html

**Steps:**
1. Login using POST /api/auth/login to get JWT token
2. Copy the JWT token
3. Paste token in the 'JWT Token' field
4. Click 'Authenticate' button
5. Enter conversation ID and click 'Join Conversation'
6. Send messages to test real-time messaging
7. Open multiple tabs to test multi-user chat

## Common Issues & Solutions

### Connection Failed

**Solution:** Check CORS settings and ensure server URL is correct

### Authentication Error

**Solution:** Verify JWT token is valid and not expired

### Messages Not Sending

**Solution:** Ensure you are authenticated and have joined the conversation room

### Not Receiving Messages

**Solution:** Check that you have joined the correct conversation room

### Typing Indicators Not Working

**Solution:** Verify conversationId is correct and you are in the room

