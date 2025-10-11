import { inject, injectable } from 'inversify';
import { TYPES } from '@shared/types/service.types';
import { IChatRepository, SendMessageData, ChatMessageWithReply } from '@business/interfaces/chat.interfaces';
import { SocketService } from '@shared/infra/socket/socket.service';
import { ChatConversation, ChatMessage, ChatType, PrismaClient, User, Shop, Prisma } from '../../../generated/prisma';
import appConfig from '@shared/config/app.config';

interface ChatConversationWithCount extends Omit<ChatConversation, '_count'> {
    user?: User | null;
    shop?: Shop | null;
    adminUser?: User | null;
    messages: ChatMessage[];
    countNotRead: number;
}

@injectable()
export class ChatRepository implements IChatRepository {
    constructor(
        @inject(TYPES.PrismaClient) private prisma: PrismaClient,
        @inject(TYPES.SocketService) private socketService: SocketService
    ) { }

    async createConversation(data: {
        type: ChatType;
        userId?: string;
        shopId?: string;
        adminUserId?: string;
        title?: string;
    }): Promise<ChatConversation> {
        // Use a proper logging library here if needed, e.g., this.logger.info('Creating conversation', data);

        // Validate shopId exists if provided
        if (data.shopId) {
            const shop = await this.prisma.shop.findUnique({
                where: { id: data.shopId }
            });
            if (!shop) {
                throw new Error(`Shop with ID ${data.shopId} does not exist`);
            }
        }

        // Validate userId exists if provided
        if (data.userId) {
            const user = await this.prisma.user.findUnique({
                where: { id: data.userId }
            });
            if (!user) {
                throw new Error(`User with ID ${data.userId} does not exist`);
            }
        }

        // Validate adminUserId exists if provided
        if (data.adminUserId) {
            const adminUser = await this.prisma.user.findUnique({
                where: { id: data.adminUserId }
            });
            if (!adminUser) {
                throw new Error(`Admin user with ID ${data.adminUserId} does not exist`);
            }
        }

        const conversation = await this.prisma.chatConversation.create({
            data: {
                type: data.type,
                userId: data.userId,
                shopId: data.shopId,
                adminUserId: data.adminUserId,
                title: data.title,
                status: 'ACTIVE'
            }
        });

        // Notify all participants about the new conversation
        if (data.userId) {
            this.socketService.emitConversationListUpdate(data.userId);
        }
        if (data.shopId) {
            this.socketService.emitConversationListUpdate(data.shopId);
        }
        if (data.adminUserId) {
            this.socketService.emitConversationListUpdate(data.adminUserId);
        }

        return conversation;
    }

    async sendMessage(data: SendMessageData): Promise<ChatMessage> {
        // Validate required fields
        if (!data.senderId) {
            throw new Error("senderId is required");
        }

        if (!data.senderType) {
            throw new Error("senderType is required");
        }

        if (!data.conversationId) {
            throw new Error("conversationId is required");
        }

        // Validate replyToId if provided
        if (data.replyToId) {
            const replyToMessage = await this.prisma.chatMessage.findUnique({
                where: { id: data.replyToId }
            });
            if (!replyToMessage) {
                throw new Error(`Reply to message with ID ${data.replyToId} does not exist`);
            }
            if (replyToMessage.conversationId !== data.conversationId) {
                throw new Error("Cannot reply to message from different conversation");
            }
        }

        // Check if this is the first message in the conversation
        const messageCount = await this.prisma.chatMessage.count({
            where: { conversationId: data.conversationId }
        });
        const isFirstMessage = messageCount === 0;

        const message = await this.prisma.chatMessage.create({
            data: {
                conversationId: data.conversationId,
                senderId: data.senderId,
                senderType: data.senderType,
                message: data.message,
                messageType: data.messageType || 'TEXT',
                attachments: data.attachments,
                ...(data.replyToId && data.replyToId.trim() !== '' && { replyToId: data.replyToId })
            },
            include: {
                conversation: true,
                replyTo: {
                    include: {
                        replyTo: true // Include nested reply if exists
                    }
                }
            }
        });

        // Update the conversation's lastMessage and lastMessageAt
        await this.prisma.chatConversation.update({
            where: { id: data.conversationId },
            data: {
                lastMessage: data.message,
                lastMessageAt: new Date()
            }
        });

        this.socketService.emitNewMessage(data.conversationId, message);

        // If this is the first message, notify all participants about the conversation update
        if (isFirstMessage && message.conversation) {
            if (message.conversation.userId) {
                this.socketService.emitConversationListUpdate(message.conversation.userId);
            }
            if (message.conversation.shopId) {
                this.socketService.emitConversationListUpdate(message.conversation.shopId);
            }
            if (message.conversation.adminUserId) {
                this.socketService.emitConversationListUpdate(message.conversation.adminUserId);
            }
        }

        return message;
    }

    async sendReply(data: SendMessageData): Promise<ChatMessage> {
        // Validate that the message being replied to exists
        const originalMessage = await this.prisma.chatMessage.findUnique({
            where: { id: data.replyToId },
            include: { conversation: true }
        });

        if (!originalMessage) {
            throw new Error("Original message not found");
        }

        if (originalMessage.conversationId !== data.conversationId) {
            throw new Error("Cannot reply to message from different conversation");
        }

        return this.sendMessage(data);
    }

    async getConversations(userId: string, keyword?: string): Promise<ChatConversationWithCount[]> {
        const conversations = await this.prisma.chatConversation.findMany({
            where: {
                OR: [
                    { userId: userId },
                    { adminUserId: userId }
                ],
                status: 'ACTIVE',
                ...(keyword && {
                    OR: [
                        { title: { contains: keyword, mode: 'insensitive' } },
                        { lastMessage: { contains: keyword, mode: 'insensitive' } },
                        {
                            user: {
                                OR: [
                                    { email: { contains: keyword, mode: 'insensitive' } },
                                    {
                                        profile: {
                                            OR: [
                                                { firstName: { contains: keyword, mode: 'insensitive' } },
                                                { lastName: { contains: keyword, mode: 'insensitive' } }
                                            ]
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            shop: {
                                name: { contains: keyword, mode: 'insensitive' }
                            }
                        },
                        {
                            adminUser: {
                                OR: [
                                    { email: { contains: keyword, mode: 'insensitive' } },
                                    {
                                        profile: {
                                            OR: [
                                                { firstName: { contains: keyword, mode: 'insensitive' } },
                                                { lastName: { contains: keyword, mode: 'insensitive' } }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                })
            },
            orderBy: [
                {
                    lastMessageAt: { sort: 'desc', nulls: 'first' }
                },
                {
                    createdAt: 'desc'
                }
            ],
            include: {
                user: {
                    include: {
                        profile: true
                    }
                },
                shop: true,
                adminUser: {
                    include: {
                        profile: true
                    }
                },
                messages: true,
                _count: {
                    select: {
                        messages: {
                            where: {
                                isRead: false,
                                NOT: {
                                    senderId: userId
                                }
                            }
                        }
                    }
                }
            }
        });

        // Map the result to replace _count with countNotRead
        return conversations.map(conv => ({
            ...conv,
            countNotRead: conv._count.messages,
        }));
    }

    async getConversationsForShop(shopId: string, keyword?: string): Promise<ChatConversationWithCount[]> {
        const conversations = await this.prisma.chatConversation.findMany({
            where: {
                shopId: shopId,
                status: 'ACTIVE',
                ...(keyword && {
                    OR: [
                        { title: { contains: keyword, mode: 'insensitive' } },
                        { lastMessage: { contains: keyword, mode: 'insensitive' } },
                        {
                            user: {
                                OR: [
                                    { email: { contains: keyword, mode: 'insensitive' } },
                                    {
                                        profile: {
                                            OR: [
                                                { firstName: { contains: keyword, mode: 'insensitive' } },
                                                { lastName: { contains: keyword, mode: 'insensitive' } }
                                            ]
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            shop: {
                                name: { contains: keyword, mode: 'insensitive' }
                            }
                        },
                        {
                            adminUser: {
                                OR: [
                                    { email: { contains: keyword, mode: 'insensitive' } },
                                    {
                                        profile: {
                                            OR: [
                                                { firstName: { contains: keyword, mode: 'insensitive' } },
                                                { lastName: { contains: keyword, mode: 'insensitive' } }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                })
            },
            orderBy: [
                {
                    lastMessageAt: { sort: 'desc', nulls: 'first' }
                },
                {
                    createdAt: 'desc'
                }
            ],
            include: {
                user: {
                    include: {
                        profile: true
                    }
                },
                shop: true,
                adminUser: {
                    include: {
                        profile: true
                    }
                },
                messages: true,
                _count: {
                    select: {
                        messages: {
                            where: {
                                isRead: false,
                                NOT: {
                                    senderId: shopId
                                }
                            }
                        }
                    }
                }
            }
        });

        // Map the result to replace _count with countNotRead
        return conversations.map(conv => ({
            ...conv,
            countNotRead: conv._count.messages,
        }));
    }

    async getMessages(conversationId: string): Promise<ChatMessageWithReply[]> {
        const messages = await this.prisma.chatMessage.findMany({
            where: {
                conversationId: conversationId
            },
            orderBy: {
                createdAt: 'asc'
            },
            include: {
                replyTo: {
                    include: {
                        replyTo: true // Support nested replies (reply to reply)
                    }
                },
                replies: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });

        // Helper function to process attachments - convert relative URL to full URL
        // Handle JsonValue type from Prisma (can be string, number, boolean, null, array, or object)
        const processAttachments = (attachments: Prisma.JsonValue): string | null => {
            if (!attachments) return null;

            // Convert JsonValue to string if it's a string type
            const attachmentStr = typeof attachments === 'string' ? attachments : null;

            if (attachmentStr && !attachmentStr.startsWith('http')) {
                // If attachments is a relative URL, convert to full URL
                return `${appConfig.apiBase}${attachmentStr}`;
            }
            return attachmentStr;
        };

        // Process messages to add full URL to attachments
        const processedMessages = messages.map(message => ({
            ...message,
            attachments: message.messageType === 'IMAGE' ? processAttachments(message.attachments) : message.attachments,
            replyTo: message.replyTo ? {
                ...message.replyTo,
                attachments: message.replyTo.messageType === 'IMAGE' ? processAttachments(message.replyTo.attachments) : message.replyTo.attachments,
                replyTo: message.replyTo.replyTo ? {
                    ...message.replyTo.replyTo,
                    attachments: message.replyTo.replyTo.messageType === 'IMAGE' ? processAttachments(message.replyTo.replyTo.attachments) : message.replyTo.replyTo.attachments
                } : message.replyTo.replyTo
            } : message.replyTo,
            replies: message.replies?.map(reply => ({
                ...reply,
                attachments: reply.messageType === 'IMAGE' ? processAttachments(reply.attachments) : reply.attachments
            }))
        }));

        return processedMessages as ChatMessageWithReply[];
    }

    async markAsRead(conversationId: string, userId: string): Promise<void> {
        await this.prisma.chatMessage.updateMany({
            where: {
                conversationId: conversationId,
                isRead: false,
                NOT: {
                    senderId: userId
                }
            },
            data: {
                isRead: true,
                readAt: new Date()
            }
        });
    }

    async markAsReadForShop(conversationId: string, shopId: string): Promise<void> {
        await this.prisma.chatMessage.updateMany({
            where: {
                conversationId: conversationId,
                isRead: false,
                NOT: {
                    senderId: shopId
                }
            },
            data: {
                isRead: true,
                readAt: new Date()
            }
        });
    }

}
