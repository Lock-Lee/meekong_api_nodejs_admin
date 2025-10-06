import { inject, injectable } from 'inversify';
import { TYPES } from '@shared/types/service.types';
import { IChatService } from '@business/interfaces/chat.interfaces';
import { Request, Response } from 'express';
import appConfig from '@shared/config/app.config';

@injectable()
export class ChatController {
    constructor(
        @inject(TYPES.ChatService) private chatService: IChatService
    ) { }

    async createConversation(req: Request, res: Response) {
        const userId = req.userId;
        const conversationData = {
            ...req.body,
            userId: userId
        };
        const conversation = await this.chatService.createConversation(conversationData);
        res.json(conversation);
    }

    async sendMessage(req: Request, res: Response) {
        const { conversationId } = req.params;

        // Validate required fields
        if (!req.body.senderId) {
            return res.status(400).json({ error: 'senderId is required' });
        }

        if (!req.body.senderType) {
            return res.status(400).json({ error: 'senderType is required' });
        }

        if (!req.body.message && !req.body.attachments) {
            return res.status(400).json({ error: 'message or attachments is required' });
        }

        const messageData = {
            conversationId,
            senderId: req.body.senderId,
            senderType: req.body.senderType,
            message: req.body.message || "",
            messageType: req.body.messageType || "TEXT",
            attachments: req.body.attachments,
            replyToId: req.body.replyToId
        };

        // Check if this is a reply message
        if (messageData.replyToId) {
            const message = await this.chatService.sendReply(messageData);
            res.json(message);
        } else {
            const message = await this.chatService.sendMessage(messageData);
            res.json(message);
        }
    }

    async getConversations(req: Request, res: Response) {
        const userId = req.userId; // Assuming auth middleware sets user
        if (!userId) {
            return res.status(401).json({ error: 'User ID is required' });
        }
        const conversations = await this.chatService.getConversations(userId);
        res.json(conversations);
    }

    async getConversationsForShop(req: Request, res: Response) {
        const { shopId } = req.params;
        if (!shopId) {
            return res.status(400).json({ error: 'Shop ID is required' });
        }
        const conversations = await this.chatService.getConversationsForShop(shopId);
        res.json(conversations);
    }

    async getMessages(req: Request, res: Response) {
        const { conversationId } = req.params;
        const messages = await this.chatService.getMessages(conversationId);
        res.json(messages);
    }

    async sendReply(req: Request, res: Response) {
        const { conversationId, messageId } = req.params;

        if (!messageId) {
            return res.status(400).json({ error: 'Message ID is required for reply' });
        }

        const replyData = {
            ...req.body,
            conversationId,
            replyToId: messageId
        };

        const message = await this.chatService.sendReply(replyData);
        res.json(message);
    }

    async markAsRead(req: Request, res: Response) {
        const { conversationId } = req.params;
        const userId = req?.userId; // Assuming auth middleware sets user
        if (!userId) {
            return res.status(401).json({ error: 'User ID is required' });
        }
        if (!conversationId) {
            return res.status(400).json({ error: 'Conversation ID is required' });
        }

        await this.chatService.markAsRead(conversationId, userId);
        res.json({ success: true });
    }

    async sendImageMessage(req: Request, res: Response) {
        const { conversationId } = req.params;

        if (!req.files || !req.files.image) {
            return res.status(400).json({ error: 'Image file is required' });
        }

        const image = Array.isArray(req.files.image) ? req.files.image[0] : req.files.image;

        const imageMessageData = {
            conversationId,
            senderId: req.body.senderId,
            senderType: req.body.senderType,
            message: req.body.message, // Optional caption
            image,
            replyToId: req.body.replyToId
        };

        const message = await this.chatService.sendImageMessage(imageMessageData);
        res.json(message);
    }

    async uploadChatImage(req: Request, res: Response) {
        if (!req.files || !req.files.image) {
            return res.status(400).json({ error: 'Image file is required' });
        }

        const image = Array.isArray(req.files.image) ? req.files.image[0] : req.files.image;

        const uploadResult = await this.chatService.uploadChatImage(image);
        res.json({
            imageUrl: uploadResult.imageUrl,
            fullImageUrl: `${appConfig.apiBase}${uploadResult.imageUrl}`,
            imageId: uploadResult.imageId,
            filePath: uploadResult.filePath
        });
    }
}
