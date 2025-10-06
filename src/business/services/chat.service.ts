import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { ChatConversation, ChatMessage, ChatMessageType, ChatType } from "../../../generated/prisma";
import { UploadedFile } from "express-fileupload";
import path from "path";
import fs from "fs/promises";
import { v7 as uuidv7 } from "uuid";

import { Logger } from "../../shared/utils/logger";
import { IChatService, IChatRepository, SendMessageData, ChatMessageWithReply, SendImageMessageData, ChatImageUploadResult } from "@business/interfaces/chat.interfaces";
import appConfig from "../../shared/config/app.config";

@injectable()
export class ChatService implements IChatService {
    constructor(
        @inject(TYPES.ChatRepository) private categoryRepository: IChatRepository
    ) { }

    async createConversation(data: {
        type: ChatType;
        userId?: string;
        shopId?: string;
        adminUserId?: string;
        title?: string;
    }): Promise<ChatConversation> {
        Logger.info("Creating conversation with data:", data);

        return this.categoryRepository.createConversation(data);
    }

    async sendMessage(data: SendMessageData): Promise<ChatMessage> {
        Logger.info("Sending message with data:", data);

        return this.categoryRepository.sendMessage(data);
    }

    async sendReply(data: SendMessageData): Promise<ChatMessage> {
        Logger.info("Sending reply with data:", data);

        if (!data.replyToId) {
            throw new Error("Reply message must have replyToId");
        }

        // Set message type to REPLY
        const replyData = {
            ...data,
            messageType: "REPLY" as ChatMessageType
        };

        return this.categoryRepository.sendReply(replyData);
    }

    async getConversations(userId: string): Promise<ChatConversation[]> {
        Logger.info("Fetching conversations for user:", { userId });

        return this.categoryRepository.getConversations(userId);
    }

    async getConversationsForShop(shopId: string): Promise<ChatConversation[]> {
        Logger.info("Fetching conversations for shop:", { shopId });

        return this.categoryRepository.getConversationsForShop(shopId);
    }

    async getMessages(conversationId: string): Promise<ChatMessageWithReply[]> {
        Logger.info("Fetching messages for conversation:", { conversationId });

        return this.categoryRepository.getMessages(conversationId);
    }

    async sendImageMessage(data: SendImageMessageData): Promise<ChatMessage> {
        Logger.info("Sending image message", { conversationId: data.conversationId, senderId: data.senderId });

        // Upload the image first
        const uploadResult = await this.uploadChatImage(data.image);

        // Create message data with image attachment
        const messageData: SendMessageData = {
            conversationId: data.conversationId,
            senderId: data.senderId,
            senderType: data.senderType,
            message: data.message || "", // Empty message if no caption
            messageType: "IMAGE" as ChatMessageType,
            attachments: `${appConfig.apiBase}${uploadResult.imageUrl}`,
            replyToId: data.replyToId
        };

        // Send the message with image attachment
        if (data.replyToId) {
            return this.categoryRepository.sendReply(messageData);
        } else {
            return this.categoryRepository.sendMessage(messageData);
        }
    }

    async uploadChatImage(image: UploadedFile): Promise<ChatImageUploadResult> {
        Logger.info("Uploading chat image", { filename: image.name, size: image.size });

        // Validate image
        this.validateImageFile(image);

        const uploadPath = path.join(process.cwd(), "public/images/chat");
        await fs.mkdir(uploadPath, { recursive: true });

        const newImageId = uuidv7();
        const fileExtension = path.extname(image.name);
        const newFileName = `${newImageId}${fileExtension}`;
        const filePath = path.join(uploadPath, newFileName);

        await image.mv(filePath);

        const imageUrl = `/images/chat/${newFileName}`;

        Logger.info("Chat image uploaded successfully", {
            filename: newFileName,
            imageUrl,
            apiBase: appConfig.apiBase
        });

        return {
            imageUrl,
            filePath,
            imageId: newImageId,
        };
    }

    private validateImageFile(file: UploadedFile): void {
        const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(", ")}`);
        }

        if (file.size > maxSize) {
            throw new Error(`File size too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
        }
    }

    async markAsRead(conversationId: string, userId: string): Promise<void> {
        Logger.info("Marking conversation as read:", { conversationId, userId });

        return this.categoryRepository.markAsRead(conversationId, userId);
    }

    async markAsReadForShop(conversationId: string, shopId: string): Promise<void> {
        Logger.info("Marking conversation as read for shop:", { conversationId, shopId });

        return this.categoryRepository.markAsReadForShop(conversationId, shopId);
    }
}
