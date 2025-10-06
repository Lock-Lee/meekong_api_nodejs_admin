import BaseRouter, { RouteConfig } from "./router";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import AuthMiddleware from "../middlewares/auth.middleware";
import { ChatController } from "../controllers/chat.controller";

class ChatRouter extends BaseRouter {
    private readonly chatController: ChatController;

    constructor() {
        super();
        this.chatController = container.get<ChatController>(TYPES.ChatController);
    }

    protected routes(): RouteConfig[] {
        return [
            {
                /**
                 * @swagger
                 * /api/chat/conversations:
                 *   post:
                 *     tags: [Chat]
                 *     summary: Create a new conversation
                 *     security:
                 *       - bearerAuth: []
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         application/json:
                 *           schema:
                 *             type: object
                 *             properties:
                 *               type:
                 *                 type: string
                 *                 enum: [USER_SHOP, USER_ADMIN, SHOP_ADMIN]
                 *               shopId:
                 *                 type: string
                 *               title:
                 *                 type: string
                 *     responses:
                 *       200:
                 *         description: Conversation created successfully
                 *       401:
                 *         description: Unauthorized
                 */
                method: "post",
                path: "/conversations",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.chatController.createConversation.bind(this.chatController),
            },
            {
                /**
                 * @swagger
                 * /api/chat/conversations/{conversationId}/messages:
                 *   post:
                 *     tags: [Chat]
                 *     summary: Send a message in a conversation
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: conversationId
                 *         required: true
                 *         schema:
                 *           type: string
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         application/json:
                 *           schema:
                 *             type: object
                 *             required:
                 *               - senderId
                 *               - senderType
                 *             properties:
                 *               message:
                 *                 type: string
                 *                 description: The message content (required if no attachments)
                 *               messageType:
                 *                 type: string
                 *                 enum: [TEXT, IMAGE, PRODUCT, ORDER, REPLY]
                 *                 description: Type of message (for IMAGE type, use attachments field for image data)
                 *                 default: TEXT
                 *               attachments:
                 *                 type: string
                 *                 description: JSON string containing attachment data (image URLs for IMAGE type)
                 *               senderId:
                 *                 type: string
                 *                 description: ID of the message sender (required)
                 *               senderType:
                 *                 type: string
                 *                 enum: [USER, SHOP, ADMIN]
                 *                 description: Type of the sender (required)
                 *               replyToId:
                 *                 type: string
                 *                 description: ID of the message being replied to (optional)
                 *             example:
                 *               message: "Hello, how are you?"
                 *               messageType: "TEXT"
                 *               senderId: "user-uuid-123"
                 *               senderType: "USER"
                 *     responses:
                 *       200:
                 *         description: Message sent successfully
                 *       401:
                 *         description: Unauthorized
                 */
                method: "post",
                path: "/conversations/:conversationId/messages",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.chatController.sendMessage.bind(this.chatController),
            },
            {
                /**
                 * @swagger
                 * /api/chat/conversations/{conversationId}/messages/{messageId}/reply:
                 *   post:
                 *     tags: [Chat]
                 *     summary: Reply to a specific message in a conversation
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: conversationId
                 *         required: true
                 *         schema:
                 *           type: string
                 *       - in: path
                 *         name: messageId
                 *         required: true
                 *         schema:
                 *           type: string
                 *         description: ID of the message being replied to
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         application/json:
                 *           schema:
                 *             type: object
                 *             properties:
                 *               message:
                 *                 type: string
                 *               senderId:
                 *                 type: string
                 *               senderType:
                 *                 type: string
                 *                 enum: [USER, SHOP, ADMIN]
                 *               attachments:
                 *                 type: string
                 *             example:
                 *               message: "This is a reply"
                 *               senderId: ""
                 *               senderType: "USER"
                 *               attachments: ""
                 *     responses:
                 *       200:
                 *         description: Reply sent successfully
                 *       401:
                 *         description: Unauthorized
                 *       404:
                 *         description: Original message not found
                 */
                method: "post",
                path: "/conversations/:conversationId/messages/:messageId/reply",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.chatController.sendReply.bind(this.chatController),
            },
            {
                /**
                 * @swagger
                 * /api/chat/conversations:
                 *   get:
                 *     tags: [Chat]
                 *     summary: Get user's conversations
                 *     security:
                 *       - bearerAuth: []
                 *     responses:
                 *       200:
                 *         description: List of conversations
                 *       401:
                 *         description: Unauthorized
                 */
                method: "get",
                path: "/conversations",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.chatController.getConversations.bind(this.chatController),
            },
            {
                /**
                 * @swagger
                 * /api/chat/shop/{shopId}/conversations:
                 *   get:
                 *     tags: [Chat]
                 *     summary: Get conversations for a shop
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: shopId
                 *         required: true
                 *         schema:
                 *           type: string
                 *         description: Shop ID
                 *     responses:
                 *       200:
                 *         description: List of conversations for the shop
                 *         content:
                 *           application/json:
                 *             schema:
                 *               type: array
                 *               items:
                 *                 $ref: '#/components/schemas/ChatConversation'
                 *       400:
                 *         description: Shop ID is required
                 *       401:
                 *         description: Unauthorized
                 */
                method: "get",
                path: "/shop/:shopId/conversations",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.chatController.getConversationsForShop.bind(this.chatController),
            },
            {
                /**
                 * @swagger
                 * /api/chat/conversations/{conversationId}/messages:
                 *   get:
                 *     tags: [Chat]
                 *     summary: Get messages in a conversation
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: conversationId
                 *         required: true
                 *         schema:
                 *           type: string
                 *     responses:
                 *       200:
                 *         description: List of messages
                 *       401:
                 *         description: Unauthorized
                 */
                method: "get",
                path: "/conversations/:conversationId/messages",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.chatController.getMessages.bind(this.chatController),
            },
            {
                /**
                 * @swagger
                 * /api/chat/conversations/{conversationId}/read:
                 *   post:
                 *     tags: [Chat]
                 *     summary: Mark conversation messages as read
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: conversationId
                 *         required: true
                 *         schema:
                 *           type: string
                 *     responses:
                 *       200:
                 *         description: Messages marked as read
                 *       401:
                 *         description: Unauthorized
                 */
                method: "post",
                path: "/conversations/:conversationId/read",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.chatController.markAsRead.bind(this.chatController),
            },
            {
                /**
                 * @swagger
                 * /api/chat/conversations/{conversationId}/images:
                 *   post:
                 *     tags: [Chat]
                 *     summary: Send an image message in a conversation
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: conversationId
                 *         required: true
                 *         schema:
                 *           type: string
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         multipart/form-data:
                 *           schema:
                 *             type: object
                 *             properties:
                 *               image:
                 *                 type: string
                 *                 format: binary
                 *                 description: Image file to send
                 *               message:
                 *                 type: string
                 *                 description: Optional caption for the image
                 *               senderId:
                 *                 type: string
                 *                 description: ID of the sender
                 *               senderType:
                 *                 type: string
                 *                 enum: [USER, SHOP, ADMIN]
                 *                 description: Type of sender
                 *               replyToId:
                 *                 type: string
                 *                 description: ID of the message being replied to (optional)
                 *             required:
                 *               - image
                 *               - senderId
                 *               - senderType
                 *     responses:
                 *       200:
                 *         description: Image message sent successfully
                 *       400:
                 *         description: Invalid input or missing image file
                 *       401:
                 *         description: Unauthorized
                 */
                method: "post",
                path: "/conversations/:conversationId/images",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.chatController.sendImageMessage.bind(this.chatController),
            },
            {
                /**
                 * @swagger
                 * /api/chat/upload-image:
                 *   post:
                 *     tags: [Chat]
                 *     summary: Upload an image for chat (utility endpoint)
                 *     security:
                 *       - bearerAuth: []
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         multipart/form-data:
                 *           schema:
                 *             type: object
                 *             properties:
                 *               image:
                 *                 type: string
                 *                 format: binary
                 *                 description: Image file to upload
                 *             required:
                 *               - image
                 *     responses:
                 *       200:
                 *         description: Image uploaded successfully
                 *         content:
                 *           application/json:
                 *             schema:
                 *               type: object
                 *               properties:
                 *                 imageUrl:
                 *                   type: string
                 *                   description: URL of the uploaded image
                 *                 imageId:
                 *                   type: string
                 *                   description: Unique ID of the uploaded image
                 *                 filePath:
                 *                   type: string
                 *                   description: Server file path of the uploaded image
                 *       400:
                 *         description: Invalid input or missing image file
                 *       401:
                 *         description: Unauthorized
                 */
                method: "post",
                path: "/upload-image",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.chatController.uploadChatImage.bind(this.chatController),
            },
        ];
    }
}

export default new ChatRouter().router;
