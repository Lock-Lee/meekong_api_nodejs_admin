import { ChatType, ChatConversation, ChatSenderType, ChatMessageType, ChatMessage } from "../../../generated/prisma";
import { UploadedFile } from "express-fileupload";

export interface SendMessageData {
    conversationId: string;
    senderId: string;
    senderType: ChatSenderType;
    message: string;
    messageType?: ChatMessageType;
    attachments?: string;
    replyToId?: string; // ID ของข้อความที่ต้องการตอบกลับ
}

export interface SendImageMessageData {
    conversationId: string;
    senderId: string;
    senderType: ChatSenderType;
    message?: string; // Caption for the image (optional)
    image: UploadedFile;
    replyToId?: string; // ID ของข้อความที่ต้องการตอบกลับ
}

export interface ChatImageUploadResult {
    imageUrl: string;
    filePath: string;
    imageId: string;
}

export interface ChatMessageWithReply extends ChatMessage {
    replyTo?: ChatMessage | null;
    replies?: ChatMessage[];
}

export interface IChatService {
    createConversation(data: {
        type: ChatType;
        userId?: string;
        shopId?: string;
        adminUserId?: string;
        title?: string;
    }): Promise<ChatConversation>;

    sendMessage(data: SendMessageData): Promise<ChatMessage>;

    sendReply(data: SendMessageData): Promise<ChatMessage>;

    sendImageMessage(data: SendImageMessageData): Promise<ChatMessage>;

    uploadChatImage(image: UploadedFile): Promise<ChatImageUploadResult>;

    getConversations(userId: string, keyword?: string): Promise<ChatConversation[]>;

    getConversationsForShop(shopId: string, keyword?: string): Promise<ChatConversation[]>;

    getMessages(conversationId: string): Promise<ChatMessageWithReply[]>;

    markAsRead(conversationId: string, userId: string): Promise<void>;

    markAsReadForShop(conversationId: string, shopId: string): Promise<void>;
}

export interface IChatRepository {
    createConversation(data: {
        type: ChatType;
        userId?: string;
        shopId?: string;
        adminUserId?: string;
        title?: string;
    }): Promise<ChatConversation>;

    sendMessage(data: SendMessageData): Promise<ChatMessage>;

    sendReply(data: SendMessageData): Promise<ChatMessage>;

    getConversations(userId: string, keyword?: string): Promise<ChatConversation[]>;

    getConversationsForShop(shopId: string, keyword?: string): Promise<ChatConversation[]>;

    getMessages(conversationId: string): Promise<ChatMessageWithReply[]>;

    markAsRead(conversationId: string, userId: string): Promise<void>;

    markAsReadForShop(conversationId: string, shopId: string): Promise<void>;
}   