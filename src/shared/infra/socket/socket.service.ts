import { injectable, inject } from 'inversify';
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Logger } from '@shared/utils/logger';
import { TYPES } from '@shared/types/service.types';
import { ITokenService } from '@business/interfaces/auth.interfaces';
import { PrismaClient, ChatMessage, Prisma } from '../../../../generated/prisma';

interface SocketData {
    userId?: string;
    username?: string;
    isAuthenticated?: boolean;
}

interface ServerToClientEvents {
    'authentication_success': (data: { userId: string; username?: string }) => void;
    'authentication_error': (data: { error: string }) => void;
    'new_message': (data: {
        messageId: string;
        username: string;
        senderId: string;
        message: string;
        conversationId: string;
        timestamp: string;
        senderType: string;
        messageType?: string;
        attachments?: Prisma.JsonValue;
        replyTo?: {
            id: string;
            message: string;
            senderId: string;
            senderType: string;
        } | null;
    }) => void;
    'user_joined': (data: { username: string; numUsers: number }) => void;
    'user_left': (data: { username: string; numUsers: number }) => void;
    'typing': (data: { username: string; conversationId: string }) => void;
    'stop_typing': (data: { username: string; conversationId: string }) => void;
    'login': (data: { numUsers: number }) => void;
    'conversation_joined': (data: { conversationId: string; username: string }) => void;
    'conversation_left': (data: { conversationId: string; username: string }) => void;
    'message_read': (data: { conversationId: string; userId: string }) => void;
    'unread_count_updated': (data: { conversationId: string; unreadCount: number; lastMessage?: string; lastMessageTime?: string }) => void;
    'conversation_list_updated': (data: { conversations: Array<{ id: string; name: string; lastMessage: string; lastMessageTime: string; unreadCount: number; participants: string[] }> }) => void;

    // Satisfy (negotiation): server pushes count updates per item
    'satisfy_count_update': (data: { itemId: string; count: number }) => void;
}

interface ClientToServerEvents {
    'authenticate': (data: { token: string; username?: string }) => void;
    'new_message': (data: { message: string; conversationId: string }) => void;
    'add_user': (username: string) => void;
    'typing': (data: { conversationId: string }) => void;
    'stop_typing': (data: { conversationId: string }) => void;
    'join_conversation': (conversationId: string) => void;
    'leave_conversation': (conversationId: string) => void;
    'mark_as_read': (data: { conversationId: string }) => void;
    'get_conversation_list': () => void;
    'get_unread_count': (data: { conversationId: string }) => void;

    // Satisfy (negotiation): client joins/leaves an item room to receive count updates
    'satisfy_join_item': (itemId: string) => void;
    'satisfy_leave_item': (itemId: string) => void;
}

interface InterServerEvents {
    ping: () => void;
}

@injectable()
export class SocketService {
    private io: SocketIOServer<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
    > | null = null;
    private numUsers = 0;
    private userSockets = new Map<string, Socket>();

    // Track unread messages per user per conversation
    private userUnreadCounts = new Map<string, Map<string, number>>(); // userId -> conversationId -> unreadCount

    // Track conversation metadata
    private conversationData = new Map<string, {
        name: string;
        lastMessage: string;
        lastMessageTime: string;
        participants: Set<string>;
    }>();

    constructor(
        @inject(TYPES.TokenService) private tokenService: ITokenService,
        @inject(TYPES.PrismaClient) private prisma: PrismaClient
    ) { }

    public initialize(httpServer: HttpServer): void {
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: [
                    "http://localhost:3000",
                    process.env.API_BASE || "http://18.143.121.54",
                    "http://127.0.0.1:5500",
                    "http://localhost:5500",
                ],
                methods: ["GET", "POST"],
                credentials: true,
            },
        });

        this.setupSocketHandlers();
        Logger.info('🔌 Socket.IO server initialized successfully');
    }

    private setupSocketHandlers(): void {
        if (!this.io) return;

        this.io.on('connection', (socket: Socket) => {
            let addedUser = false;

            Logger.info('👤 User connected', { socketId: socket.id });

            // Handle authentication
            socket.on('authenticate', async (data) => {
                try {
                    const { token, username } = data;

                    if (!token) {
                        socket.emit('authentication_error', { error: 'Token is required' });
                        return;
                    }

                    // Verify JWT token
                    const decoded = this.tokenService.verifyAccessToken(token);

                    // Store authenticated user data
                    socket.data.userId = decoded.userId;
                    socket.data.username = username || `User_${decoded.userId}`;
                    socket.data.isAuthenticated = true;

                    // Track authenticated user socket
                    this.userSockets.set(decoded.userId, socket);

                    socket.emit('authentication_success', {
                        userId: decoded.userId,
                        username: socket.data.username
                    });

                    Logger.info('🔐 User authenticated', {
                        userId: decoded.userId,
                        username: socket.data.username,
                        socketId: socket.id
                    });

                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
                    socket.emit('authentication_error', { error: errorMessage });

                    Logger.warn('❌ Authentication failed', {
                        socketId: socket.id,
                        error: errorMessage
                    });
                }
            });

            // Satisfy: join a specific item room to receive negotiation count updates
            socket.on('satisfy_join_item', (itemId: string) => {
                if (!itemId) return;
                socket.join(`satisfy:item:${itemId}`);
                Logger.info('🤝 Joined satisfy item room', { itemId, socketId: socket.id });
            });

            // Satisfy: leave the item room
            socket.on('satisfy_leave_item', (itemId: string) => {
                if (!itemId) return;
                socket.leave(`satisfy:item:${itemId}`);
                Logger.info('🤝 Left satisfy item room', { itemId, socketId: socket.id });
            });

            // Handle adding user to chat (deprecated - use authenticate instead)
            socket.on('add_user', (username: string) => {
                if (addedUser) return;

                // Store user data in socket
                socket.data.username = username;
                socket.data.userId = socket.id; // You can replace this with actual user ID from auth

                // Track user socket
                this.userSockets.set(socket.data.userId, socket);

                ++this.numUsers;
                addedUser = true;

                // Emit login success to current user
                socket.emit('login', {
                    numUsers: this.numUsers,
                });

                // Broadcast user joined to all other users
                socket.broadcast.emit('user_joined', {
                    username: socket.data.username,
                    numUsers: this.numUsers,
                });

                Logger.info('✅ User joined chat', {
                    username: socket.data.username,
                    userId: socket.data.userId,
                    totalUsers: this.numUsers
                });
            });

            // Handle new messages
            socket.on('new_message', (data) => {
                if (!socket.data.username || !socket.data.userId) {
                    Logger.warn('⚠️ Message from unauthenticated user, but allowing for legacy compatibility', { socketId: socket.id });
                    // Don't return, allow message to continue for legacy compatibility
                }

                const senderId = socket.data.userId || socket.id;
                const conversationId = data.conversationId || 'test-conversation';
                const message = typeof data === 'string' ? data : data.message;

                const messageData = {
                    messageId: `temp_${Date.now()}`, // Temporary ID, will be replaced by database ID
                    username: socket.data.username || data.username || 'Anonymous',
                    senderId,
                    message,
                    conversationId,
                    timestamp: new Date().toISOString(),
                    senderType: 'USER', // or get from user session
                    messageType: 'TEXT'
                };

                // Update conversation metadata
                this.updateConversationMetadata(conversationId, message, senderId);

                // Emit message to all users in the conversation room including sender
                this.io?.to(`conversation_${conversationId}`).emit('new_message', messageData);

                // Update unread counts for all users in the conversation (except sender)
                if (this.io) {
                    const conversationRoom = this.io.sockets.adapter.rooms.get(`conversation_${conversationId}`);
                    if (conversationRoom) {
                        conversationRoom.forEach((socketId) => {
                            const otherSocket = this.io?.sockets.sockets.get(socketId);
                            if (otherSocket && otherSocket.data.userId && otherSocket.data.userId !== senderId) {
                                // Increment unread count for other users
                                const unreadCount = this.incrementUnreadCount(otherSocket.data.userId, conversationId);

                                // Emit unread count update to the user
                                otherSocket.emit('unread_count_updated', {
                                    conversationId,
                                    unreadCount,
                                    lastMessage: message.length > 50 ? message.substring(0, 50) + '...' : message,
                                    lastMessageTime: messageData.timestamp
                                });
                            }
                        });
                    }
                }

                Logger.info('💬 Message broadcasted with unread count updates', {
                    username: socket.data.username,
                    conversationId,
                    message: message.substring(0, 50) + '...'
                });
            });

            // Handle joining conversation room
            socket.on('join_conversation', (conversationId: string) => {
                if (!socket.data.username || !socket.data.userId) {
                    Logger.warn('⚠️ Join conversation from unauthenticated user', { socketId: socket.id });
                    return;
                }

                socket.join(`conversation_${conversationId}`);

                // Add user to conversation participants
                if (!this.conversationData.has(conversationId)) {
                    this.conversationData.set(conversationId, {
                        name: `Conversation ${conversationId}`,
                        lastMessage: '',
                        lastMessageTime: new Date().toISOString(),
                        participants: new Set()
                    });
                }

                const conversationInfo = this.conversationData.get(conversationId)!;
                conversationInfo.participants.add(socket.data.userId);

                socket.to(`conversation_${conversationId}`).emit('conversation_joined', {
                    conversationId,
                    username: socket.data.username
                });

                Logger.info('🏠 User joined conversation', {
                    username: socket.data.username,
                    conversationId,
                    participantCount: conversationInfo.participants.size
                });
            });

            // Handle leaving conversation room
            socket.on('leave_conversation', (conversationId: string) => {
                if (!socket.data.username) {
                    Logger.warn('⚠️ Leave conversation from unauthenticated user', { socketId: socket.id });
                    return;
                }

                socket.leave(`conversation_${conversationId}`);

                socket.to(`conversation_${conversationId}`).emit('conversation_left', {
                    conversationId,
                    username: socket.data.username
                });

                Logger.info('🚪 User left conversation', {
                    username: socket.data.username,
                    conversationId
                });
            });

            // Handle typing indicator
            socket.on('typing', (data) => {
                if (!socket.data.username) {
                    Logger.warn('⚠️ Typing from unauthenticated user', { socketId: socket.id });
                    return;
                }

                socket.to(`conversation_${data.conversationId}`).emit('typing', {
                    username: socket.data.username,
                    conversationId: data.conversationId
                });
            });

            // Handle stop typing indicator
            socket.on('stop_typing', (data) => {
                if (!socket.data.username) {
                    Logger.warn('⚠️ Stop typing from unauthenticated user', { socketId: socket.id });
                    return;
                }

                socket.to(`conversation_${data.conversationId}`).emit('stop_typing', {
                    username: socket.data.username,
                    conversationId: data.conversationId
                });
            });

            // Handle mark as read
            socket.on('mark_as_read', (data) => {
                if (!socket.data.username || !socket.data.userId) {
                    Logger.warn('⚠️ Mark as read from unauthenticated user', { socketId: socket.id });
                    return;
                }

                // Reset unread count for this user and conversation
                this.resetUnreadCount(socket.data.userId, data.conversationId);

                socket.to(`conversation_${data.conversationId}`).emit('message_read', {
                    conversationId: data.conversationId,
                    userId: socket.data.userId
                });

                // Emit updated unread count to the user
                socket.emit('unread_count_updated', {
                    conversationId: data.conversationId,
                    unreadCount: 0
                });

                Logger.info('📖 Messages marked as read', {
                    username: socket.data.username,
                    conversationId: data.conversationId
                });
            });

            // Handle get conversation list
            socket.on('get_conversation_list', async () => {
                if (!socket.data.userId) {
                    Logger.warn('⚠️ Get conversation list from unauthenticated user', { socketId: socket.id });
                    return;
                }

                try {
                    const conversationList = await this.getUserConversationList(socket.data.userId);
                    socket.emit('conversation_list_updated', { conversations: conversationList });

                    Logger.info('📋 Conversation list sent', {
                        userId: socket.data.userId,
                        conversationCount: conversationList.length
                    });
                } catch (error) {
                    Logger.error('❌ Error sending conversation list', error);
                    socket.emit('conversation_list_updated', { conversations: [] });
                }
            });

            // Handle get unread count for specific conversation
            socket.on('get_unread_count', async (data) => {
                if (!socket.data.userId) {
                    Logger.warn('⚠️ Get unread count from unauthenticated user', { socketId: socket.id });
                    return;
                }

                try {
                    // Get unread count from both database and memory, then combine them
                    const dbUnreadCount = await this.getDatabaseUnreadCount(socket.data.userId, data.conversationId);
                    const memoryUnreadCount = this.getUnreadCount(socket.data.userId, data.conversationId);
                    const totalUnreadCount = dbUnreadCount + memoryUnreadCount;

                    const conversationInfo = await this.getConversationInfo(data.conversationId);

                    socket.emit('unread_count_updated', {
                        conversationId: data.conversationId,
                        unreadCount: totalUnreadCount,
                        lastMessage: conversationInfo?.lastMessage,
                        lastMessageTime: conversationInfo?.lastMessageTime
                    });

                    Logger.info('🔢 Unread count sent', {
                        userId: socket.data.userId,
                        conversationId: data.conversationId,
                        dbUnreadCount,
                        memoryUnreadCount,
                        totalUnreadCount
                    });
                } catch (error) {
                    Logger.error('❌ Error getting unread count', error);

                    // Fallback to memory data only
                    const unreadCount = this.getUnreadCount(socket.data.userId, data.conversationId);
                    const conversationInfo = this.conversationData.get(data.conversationId);

                    socket.emit('unread_count_updated', {
                        conversationId: data.conversationId,
                        unreadCount,
                        lastMessage: conversationInfo?.lastMessage,
                        lastMessageTime: conversationInfo?.lastMessageTime
                    });
                }
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                if (addedUser) {
                    --this.numUsers;

                    // Remove user from tracking
                    if (socket.data.userId) {
                        this.userSockets.delete(socket.data.userId);
                    }

                    // Broadcast user left to all other users
                    socket.broadcast.emit('user_left', {
                        username: socket.data.username || 'Unknown',
                        numUsers: this.numUsers,
                    });

                    Logger.info('👋 User disconnected', {
                        username: socket.data.username,
                        userId: socket.data.userId,
                        totalUsers: this.numUsers
                    });
                }
            });
        });
    }

    // Method to emit new message from backend (called by ChatRepository)
    public emitNewMessage(conversationId: string, message: ChatMessage): void {
        if (!this.io) {
            Logger.warn('⚠️ Socket.IO not initialized, cannot emit message');
            return;
        }

        const messageData = {
            messageId: message.id,
            username: `User_${message.senderId}`, // You might want to include sender info in message
            senderId: message.senderId,
            message: message.message,
            conversationId: message.conversationId,
            timestamp: message.createdAt.toISOString(),
            senderType: message.senderType,
            messageType: message.messageType,
            attachments: message.attachments,
            replyTo: null // You can include reply data if needed
        };

        // Update conversation metadata
        this.updateConversationMetadata(conversationId, message.message, message.senderId);

        // Emit to all users in the conversation room
        this.io.to(`conversation_${conversationId}`).emit('new_message', messageData);

        // Update unread counts for all users in the conversation (except sender)
        const conversationRoom = this.io.sockets.adapter.rooms.get(`conversation_${conversationId}`);
        if (conversationRoom) {
            conversationRoom.forEach((socketId) => {
                const otherSocket = this.io?.sockets.sockets.get(socketId);
                if (otherSocket && otherSocket.data.userId && otherSocket.data.userId !== message.senderId) {
                    // Increment unread count for other users
                    const unreadCount = this.incrementUnreadCount(otherSocket.data.userId, conversationId);

                    // Emit unread count update to the user
                    otherSocket.emit('unread_count_updated', {
                        conversationId,
                        unreadCount,
                        lastMessage: message.message.length > 50 ? message.message.substring(0, 50) + '...' : message.message,
                        lastMessageTime: messageData.timestamp
                    });
                }
            });
        }

        Logger.info('📤 New message emitted via Socket.IO with unread count updates', {
            conversationId,
            messageId: message.id,
            senderType: message.senderType
        });
    }

    // Method to emit to specific user
    public emitToUser(userId: string, event: keyof ServerToClientEvents, data: Parameters<ServerToClientEvents[typeof event]>[0]): void {
        if (!this.io) {
            Logger.warn('⚠️ Socket.IO not initialized, cannot emit to user');
            return;
        }

        const userSocket = this.userSockets.get(userId);
        if (userSocket) {
            userSocket.emit(event, data);
            Logger.info(`📤 Event '${event}' emitted to user ${userId}`);
        } else {
            Logger.warn(`⚠️ User ${userId} not found in connected sockets`);
        }
    }

    // Method to emit to conversation room
    public emitToConversation(conversationId: string, event: keyof ServerToClientEvents, data: Parameters<ServerToClientEvents[typeof event]>[0]): void {
        if (!this.io) {
            Logger.warn('⚠️ Socket.IO not initialized, cannot emit to conversation');
            return;
        }

        // Type assertion needed due to Socket.IO's complex typing
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.io.to(`conversation_${conversationId}`) as any).emit(event, data);
        Logger.info(`📤 Event '${event}' emitted to conversation ${conversationId}`);
    }

    // Get connected users count
    public getConnectedUsersCount(): number {
        return this.numUsers;
    }

    // Get Socket.IO instance for advanced usage
    public getIO(): SocketIOServer | null {
        return this.io;
    }

    // Emit satisfy (negotiation) count update to all clients in the item's room
    public emitSatisfyCountUpdate(itemId: string, count: number): void {
        if (!this.io) return;
        this.io.to(`satisfy:item:${itemId}`).emit('satisfy_count_update', { itemId, count });
        Logger.info('📣 Emitted satisfy_count_update', { itemId, count });
    }

    // Methods for managing unread counts
    private incrementUnreadCount(userId: string, conversationId: string): number {
        if (!this.userUnreadCounts.has(userId)) {
            this.userUnreadCounts.set(userId, new Map());
        }

        const userCounts = this.userUnreadCounts.get(userId)!;
        const currentCount = userCounts.get(conversationId) || 0;
        const newCount = currentCount + 1;
        userCounts.set(conversationId, newCount);

        return newCount;
    }

    private resetUnreadCount(userId: string, conversationId: string): void {
        if (!this.userUnreadCounts.has(userId)) {
            this.userUnreadCounts.set(userId, new Map());
        }

        const userCounts = this.userUnreadCounts.get(userId)!;
        userCounts.set(conversationId, 0);
    }

    private getUnreadCount(userId: string, conversationId: string): number {
        if (!this.userUnreadCounts.has(userId)) {
            return 0;
        }

        const userCounts = this.userUnreadCounts.get(userId)!;
        return userCounts.get(conversationId) || 0;
    }

    private async getUserConversationList(userId: string): Promise<Array<{
        id: string;
        name: string;
        lastMessage: string;
        lastMessageTime: string;
        unreadCount: number;
        participants: string[];
    }>> {
        try {
            // Get conversations from database (same as ChatRepository)
            const dbConversations = await this.prisma.chatConversation.findMany({
                where: {
                    OR: [
                        { userId: userId },
                        { adminUserId: userId }
                    ],
                    status: 'ACTIVE'
                },
                orderBy: {
                    lastMessageAt: 'desc'
                },
                include: {
                    user: true,
                    shop: true,
                    adminUser: true,
                    _count: {
                        select: {
                            messages: {
                                where: {
                                    isRead: false,
                                    NOT: { senderId: userId }
                                }
                            }
                        }
                    }
                }
            });

            // Map to Socket.IO format
            const conversations = dbConversations.map(conv => {
                // Determine conversation name based on type and participants
                let name = conv.title || `Conversation ${conv.id}`;
                if (conv.type === 'USER_SHOP' && conv.shop) {
                    name = conv.shop.name || `Shop ${conv.shopId}`;
                } else if (conv.type === 'USER_ADMIN' && conv.adminUser) {
                    name = `Admin ${conv.adminUser.email}`;
                }

                // Determine participants
                const participants: string[] = [];
                if (conv.userId) participants.push(conv.userId);
                if (conv.shopId) participants.push(conv.shopId);
                if (conv.adminUserId) participants.push(conv.adminUserId);

                return {
                    id: conv.id,
                    name,
                    lastMessage: conv.lastMessage || 'No messages yet',
                    lastMessageTime: conv.lastMessageAt?.toISOString() || new Date().toISOString(),
                    unreadCount: conv._count.messages, // Real unread count from database
                    participants
                };
            });

            return conversations;
        } catch (error) {
            Logger.error('❌ Error fetching conversation list from database', error);

            // Fallback to memory data
            return this.getFallbackConversationList(userId);
        }
    }

    // Fallback method using memory data
    private getFallbackConversationList(userId: string): Array<{
        id: string;
        name: string;
        lastMessage: string;
        lastMessageTime: string;
        unreadCount: number;
        participants: string[];
    }> {
        const conversations: Array<{
            id: string;
            name: string;
            lastMessage: string;
            lastMessageTime: string;
            unreadCount: number;
            participants: string[];
        }> = [];

        // Get all conversations this user has unread messages in
        const userCounts = this.userUnreadCounts.get(userId) || new Map();

        // Combine with conversation data
        for (const [conversationId, conversationInfo] of this.conversationData.entries()) {
            if (conversationInfo.participants.has(userId)) {
                conversations.push({
                    id: conversationId,
                    name: conversationInfo.name,
                    lastMessage: conversationInfo.lastMessage,
                    lastMessageTime: conversationInfo.lastMessageTime,
                    unreadCount: userCounts.get(conversationId) || 0,
                    participants: Array.from(conversationInfo.participants)
                });
            }
        }

        // Sort by last message time (newest first)
        conversations.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

        return conversations;
    }

    // Update conversation metadata when new message arrives
    private updateConversationMetadata(conversationId: string, message: string, senderId: string): void {
        if (!this.conversationData.has(conversationId)) {
            this.conversationData.set(conversationId, {
                name: `Conversation ${conversationId}`,
                lastMessage: '',
                lastMessageTime: '',
                participants: new Set()
            });
        }

        const conversationInfo = this.conversationData.get(conversationId)!;
        conversationInfo.lastMessage = message.length > 50 ? message.substring(0, 50) + '...' : message;
        conversationInfo.lastMessageTime = new Date().toISOString();
        conversationInfo.participants.add(senderId);
    }

    // Public method to emit unread count updates to specific user
    public emitUnreadCountUpdate(userId: string, conversationId: string): void {
        if (!this.io) return;

        const userSocket = this.userSockets.get(userId);
        if (userSocket) {
            const unreadCount = this.getUnreadCount(userId, conversationId);
            const conversationInfo = this.conversationData.get(conversationId);

            userSocket.emit('unread_count_updated', {
                conversationId,
                unreadCount,
                lastMessage: conversationInfo?.lastMessage,
                lastMessageTime: conversationInfo?.lastMessageTime
            });
        }
    }

    // Public method to emit conversation list updates to specific user
    public async emitConversationListUpdate(userId: string): Promise<void> {
        if (!this.io) return;

        const userSocket = this.userSockets.get(userId);
        if (userSocket) {
            try {
                const conversationList = await this.getUserConversationList(userId);
                userSocket.emit('conversation_list_updated', { conversations: conversationList });
            } catch (error) {
                Logger.error('❌ Error emitting conversation list update', error);
            }
        }
    }

    // Get unread count from database
    private async getDatabaseUnreadCount(userId: string, conversationId: string): Promise<number> {
        try {
            const count = await this.prisma.chatMessage.count({
                where: {
                    conversationId: conversationId,
                    isRead: false,
                    NOT: { senderId: userId }
                }
            });
            return count;
        } catch (error) {
            Logger.error('❌ Error getting database unread count', error);
            return 0;
        }
    }

    // Get conversation info from database
    private async getConversationInfo(conversationId: string): Promise<{
        lastMessage?: string;
        lastMessageTime?: string;
    } | null> {
        try {
            const conversation = await this.prisma.chatConversation.findUnique({
                where: { id: conversationId },
                select: {
                    lastMessage: true,
                    lastMessageAt: true
                }
            });

            if (!conversation) return null;

            return {
                lastMessage: conversation.lastMessage || undefined,
                lastMessageTime: conversation.lastMessageAt?.toISOString()
            };
        } catch (error) {
            Logger.error('❌ Error getting conversation info', error);
            return null;
        }
    }
}
