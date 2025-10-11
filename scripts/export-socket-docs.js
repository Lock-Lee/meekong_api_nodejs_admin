const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../docs');
const JSON_OUTPUT = path.join(OUTPUT_DIR, 'socket-io-docs.json');
const MD_OUTPUT = path.join(OUTPUT_DIR, 'socket-io-api.md');

// Socket.IO Event Documentation
const socketDocs = {
  info: {
    title: "Meekong Socket.IO API Documentation",
    version: "1.0.0",
    description: "Real-time Socket.IO events for the Meekong API",
    serverUrl: process.env.BASE_URL || "http://localhost:3000"
  },

  authentication: {
    required: true,
    type: "JWT Bearer Token",
    description: "Client must authenticate using JWT token before using other events",
    example: {
      event: "authenticate",
      payload: {
        token: "your-jwt-token-here",
        username: "optional-display-name"
      }
    }
  },

  clientToServerEvents: [
    {
      event: "authenticate",
      description: "Authenticate user with JWT token (Required)",
      payload: {
        token: "string (required) - JWT access token",
        username: "string (optional) - Display name for the user"
      },
      responses: ["authentication_success", "authentication_error"],
      example: `socket.emit('authenticate', {
  token: 'eyJhbGciOiJIUzI1NiIs...',
  username: 'John Doe'
});`
    },
    {
      event: "new_message",
      description: "Send a new message to a conversation",
      payload: {
        message: "string (required) - Message content",
        conversationId: "string (required) - Conversation ID"
      },
      authentication: "Required",
      broadcasts: "new_message event to all users in conversation room",
      example: `socket.emit('new_message', {
  message: 'Hello!',
  conversationId: 'conv-123-456'
});`
    },
    {
      event: "join_conversation",
      description: "Join a conversation room to receive real-time messages",
      payload: "conversationId: string",
      authentication: "Required",
      broadcasts: "conversation_joined to other users in room",
      example: `socket.emit('join_conversation', 'conv-123-456');`
    },
    {
      event: "leave_conversation",
      description: "Leave a conversation room",
      payload: "conversationId: string",
      authentication: "Required",
      broadcasts: "conversation_left to other users in room",
      example: `socket.emit('leave_conversation', 'conv-123-456');`
    },
    {
      event: "typing",
      description: "Indicate user is typing in a conversation",
      payload: {
        conversationId: "string (required)"
      },
      authentication: "Required",
      broadcasts: "typing event to other users in conversation",
      example: `socket.emit('typing', { conversationId: 'conv-123-456' });`
    },
    {
      event: "stop_typing",
      description: "Indicate user stopped typing",
      payload: {
        conversationId: "string (required)"
      },
      authentication: "Required",
      broadcasts: "stop_typing event to other users in conversation",
      example: `socket.emit('stop_typing', { conversationId: 'conv-123-456' });`
    },
    {
      event: "mark_as_read",
      description: "Mark all messages in a conversation as read",
      payload: {
        conversationId: "string (required)"
      },
      authentication: "Required",
      broadcasts: "message_read to other users, unread_count_updated to sender",
      example: `socket.emit('mark_as_read', { conversationId: 'conv-123-456' });`
    },
    {
      event: "get_conversation_list",
      description: "Request list of all user's conversations",
      payload: "none",
      authentication: "Required",
      response: "conversation_list_updated",
      example: `socket.emit('get_conversation_list');`
    },
    {
      event: "get_unread_count",
      description: "Request unread message count for a conversation",
      payload: {
        conversationId: "string (required)"
      },
      authentication: "Required",
      response: "unread_count_updated",
      example: `socket.emit('get_unread_count', { conversationId: 'conv-123-456' });`
    },
    {
      event: "satisfy_join_item",
      description: "Join item room to receive satisfy/negotiation count updates",
      payload: "itemId: string",
      authentication: "Optional",
      broadcasts: "satisfy_count_update when count changes",
      example: `socket.emit('satisfy_join_item', 'item-123-456');`
    },
    {
      event: "satisfy_leave_item",
      description: "Leave item room",
      payload: "itemId: string",
      authentication: "Optional",
      example: `socket.emit('satisfy_leave_item', 'item-123-456');`
    },
    {
      event: "add_user",
      description: "DEPRECATED: Legacy authentication method (use 'authenticate' instead)",
      payload: "username: string",
      response: "login",
      deprecated: true
    }
  ],

  serverToClientEvents: [
    {
      event: "authentication_success",
      description: "Authentication successful",
      payload: {
        userId: "string - Authenticated user ID",
        username: "string - Display name"
      },
      example: `socket.on('authentication_success', (data) => {
  console.log('Authenticated as:', data.username);
  console.log('User ID:', data.userId);
});`
    },
    {
      event: "authentication_error",
      description: "Authentication failed",
      payload: {
        error: "string - Error message"
      },
      example: `socket.on('authentication_error', (data) => {
  console.error('Auth failed:', data.error);
});`
    },
    {
      event: "new_message",
      description: "New message received in conversation",
      payload: {
        messageId: "string - Message ID",
        username: "string - Sender's display name",
        senderId: "string - Sender's user ID",
        message: "string - Message content",
        conversationId: "string - Conversation ID",
        timestamp: "string (ISO 8601) - Message timestamp",
        senderType: "string - USER or SHOP",
        messageType: "string - TEXT or IMAGE",
        attachments: "string (optional) - Attachment URLs",
        replyTo: "object (optional) - Referenced message if this is a reply"
      },
      example: `socket.on('new_message', (data) => {
  console.log(data.username + ': ' + data.message);
  displayMessage(data);
});`
    },
    {
      event: "conversation_joined",
      description: "User joined conversation",
      payload: {
        conversationId: "string",
        username: "string"
      },
      example: `socket.on('conversation_joined', (data) => {
  console.log(data.username + ' joined conversation');
});`
    },
    {
      event: "conversation_left",
      description: "User left conversation",
      payload: {
        conversationId: "string",
        username: "string"
      },
      example: `socket.on('conversation_left', (data) => {
  console.log(data.username + ' left conversation');
});`
    },
    {
      event: "typing",
      description: "User is typing",
      payload: {
        username: "string",
        conversationId: "string"
      },
      example: `socket.on('typing', (data) => {
  showTypingIndicator(data.username);
});`
    },
    {
      event: "stop_typing",
      description: "User stopped typing",
      payload: {
        username: "string",
        conversationId: "string"
      },
      example: `socket.on('stop_typing', (data) => {
  hideTypingIndicator(data.username);
});`
    },
    {
      event: "message_read",
      description: "Messages were marked as read by a user",
      payload: {
        conversationId: "string",
        userId: "string - User who read the messages"
      },
      example: `socket.on('message_read', (data) => {
  updateReadStatus(data.conversationId, data.userId);
});`
    },
    {
      event: "unread_count_updated",
      description: "Unread message count updated",
      payload: {
        conversationId: "string",
        unreadCount: "number",
        lastMessage: "string (optional) - Preview of last message",
        lastMessageTime: "string (optional, ISO 8601) - Timestamp of last message"
      },
      example: `socket.on('unread_count_updated', (data) => {
  updateBadge(data.conversationId, data.unreadCount);
});`
    },
    {
      event: "conversation_list_updated",
      description: "Conversation list with metadata",
      payload: {
        conversations: "array - List of conversation objects with id, name, lastMessage, lastMessageTime, unreadCount, participants"
      },
      example: `socket.on('conversation_list_updated', (data) => {
  renderConversationList(data.conversations);
});`
    },
    {
      event: "satisfy_count_update",
      description: "Satisfy/negotiation participant count updated for an item",
      payload: {
        itemId: "string - Item ID",
        count: "number - Current participant count"
      },
      example: `socket.on('satisfy_count_update', (data) => {
  updateItemCount(data.itemId, data.count);
});`
    },
    {
      event: "user_joined",
      description: "DEPRECATED: Legacy event (user joined chat)",
      payload: {
        username: "string",
        numUsers: "number"
      },
      deprecated: true
    },
    {
      event: "user_left",
      description: "DEPRECATED: Legacy event (user left chat)",
      payload: {
        username: "string",
        numUsers: "number"
      },
      deprecated: true
    },
    {
      event: "login",
      description: "DEPRECATED: Legacy login event",
      payload: {
        numUsers: "number"
      },
      deprecated: true
    }
  ],

  connectionExample: `// Connect to Socket.IO server
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
}`,

  testingGuide: {
    authenticated: {
      url: "http://localhost:3000/socket-chat-auth-test.html",
      steps: [
        "Login using POST /api/auth/login to get JWT token",
        "Copy the JWT token",
        "Paste token in the 'JWT Token' field",
        "Click 'Authenticate' button",
        "Enter conversation ID and click 'Join Conversation'",
        "Send messages to test real-time messaging",
        "Open multiple tabs to test multi-user chat"
      ]
    },
    legacy: {
      url: "http://localhost:3000/socket-chat-test.html",
      note: "Legacy mode without authentication",
      deprecated: true
    }
  },

  commonIssues: [
    {
      issue: "Connection Failed",
      solution: "Check CORS settings and ensure server URL is correct"
    },
    {
      issue: "Authentication Error",
      solution: "Verify JWT token is valid and not expired"
    },
    {
      issue: "Messages Not Sending",
      solution: "Ensure you are authenticated and have joined the conversation room"
    },
    {
      issue: "Not Receiving Messages",
      solution: "Check that you have joined the correct conversation room"
    },
    {
      issue: "Typing Indicators Not Working",
      solution: "Verify conversationId is correct and you are in the room"
    }
  ]
};

// Create docs directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Export as JSON
fs.writeFileSync(JSON_OUTPUT, JSON.stringify(socketDocs, null, 2));
console.log(`✅ Socket.IO documentation exported to JSON: ${JSON_OUTPUT}`);

// Generate Markdown documentation
const markdown = generateMarkdown(socketDocs);
fs.writeFileSync(MD_OUTPUT, markdown);
console.log(`✅ Socket.IO documentation exported to Markdown: ${MD_OUTPUT}`);

console.log('\n📚 Socket.IO Documentation exported successfully!');
console.log(`   JSON: ${JSON_OUTPUT}`);
console.log(`   Markdown: ${MD_OUTPUT}`);

function generateMarkdown(docs) {
  let md = `# ${docs.info.title}\n\n`;
  md += `**Version:** ${docs.info.version}  \n`;
  md += `**Server:** ${docs.info.serverUrl}  \n\n`;
  md += `${docs.info.description}\n\n`;

  // Authentication
  md += `## Authentication\n\n`;
  md += `**Required:** ${docs.authentication.required ? 'Yes' : 'No'}  \n`;
  md += `**Type:** ${docs.authentication.type}  \n\n`;
  md += `${docs.authentication.description}\n\n`;
  md += `\`\`\`javascript\n${docs.authentication.example.event}\n${JSON.stringify(docs.authentication.example.payload, null, 2)}\n\`\`\`\n\n`;

  // Client to Server Events
  md += `## Client → Server Events\n\n`;
  docs.clientToServerEvents.forEach(event => {
    md += `### ${event.event}${event.deprecated ? ' ⚠️ DEPRECATED' : ''}\n\n`;
    md += `${event.description}\n\n`;

    if (event.payload) {
      md += `**Payload:**\n\`\`\`javascript\n${typeof event.payload === 'string' ? event.payload : JSON.stringify(event.payload, null, 2)}\n\`\`\`\n\n`;
    }

    if (event.authentication) {
      md += `**Authentication:** ${event.authentication}  \n`;
    }

    if (event.broadcasts) {
      md += `**Broadcasts:** ${event.broadcasts}  \n`;
    }

    if (event.response) {
      md += `**Response:** ${event.response}  \n`;
    }

    if (event.example) {
      md += `\n**Example:**\n\`\`\`javascript\n${event.example}\n\`\`\`\n\n`;
    }

    md += `---\n\n`;
  });

  // Server to Client Events
  md += `## Server → Client Events\n\n`;
  docs.serverToClientEvents.forEach(event => {
    md += `### ${event.event}${event.deprecated ? ' ⚠️ DEPRECATED' : ''}\n\n`;
    md += `${event.description}\n\n`;

    if (event.payload) {
      md += `**Payload:**\n\`\`\`javascript\n${typeof event.payload === 'string' ? event.payload : JSON.stringify(event.payload, null, 2)}\n\`\`\`\n\n`;
    }

    if (event.example) {
      md += `**Example:**\n\`\`\`javascript\n${event.example}\n\`\`\`\n\n`;
    }

    md += `---\n\n`;
  });

  // Connection Example
  md += `## Connection Example\n\n`;
  md += `\`\`\`javascript\n${docs.connectionExample}\n\`\`\`\n\n`;

  // Testing Guide
  md += `## Testing Guide\n\n`;
  md += `### With Authentication (Recommended)\n\n`;
  md += `**URL:** ${docs.testingGuide.authenticated.url}\n\n`;
  md += `**Steps:**\n`;
  docs.testingGuide.authenticated.steps.forEach((step, i) => {
    md += `${i + 1}. ${step}\n`;
  });
  md += `\n`;

  // Common Issues
  md += `## Common Issues & Solutions\n\n`;
  docs.commonIssues.forEach(item => {
    md += `### ${item.issue}\n\n`;
    md += `**Solution:** ${item.solution}\n\n`;
  });

  return md;
}
