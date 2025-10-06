import express from 'express';
import { container } from '@main/inversify.config';
import { OnlineController } from '@controllers/online.controller';
import AuthMiddleware from '@middlewares/auth.middleware';

const onlineRouter = express.Router();
const onlineController = container.get<OnlineController>(OnlineController);

/**
 * @swagger
 * /api/online/users:
 *   get:
 *     summary: Get online users count
 *     tags: [Online Status]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Online users count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     onlineUsersCount:
 *                       type: number
 *                     totalSocketConnections:
 *                       type: number
 */
onlineRouter.get('/users', AuthMiddleware.authenticateUser, onlineController.getOnlineUsersCount);

/**
 * @swagger
 * /api/online/users/list:
 *   get:
 *     summary: Get list of online user IDs
 *     tags: [Online Status]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Online users list retrieved successfully
 */
onlineRouter.get('/users/list', AuthMiddleware.authenticateUser, onlineController.getOnlineUsersList);

/**
 * @swagger
 * /api/online/users/detail:
 *   get:
 *     summary: Get detailed online users information
 *     tags: [Online Status]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Online users detail retrieved successfully
 */
onlineRouter.get('/users/detail', AuthMiddleware.authenticateUser, onlineController.getOnlineUsersDetail);

/**
 * @swagger
 * /api/online/users/{userId}/status:
 *   get:
 *     summary: Check if specific user is online
 *     tags: [Online Status]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to check
 *     responses:
 *       200:
 *         description: User online status retrieved successfully
 */
onlineRouter.get('/users/:userId/status', AuthMiddleware.authenticateUser, onlineController.getUserOnlineStatus);

/**
 * @swagger
 * /api/online/rooms:
 *   get:
 *     summary: Get all active chat rooms with member counts
 *     tags: [Online Status]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Active rooms retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       conversationId:
 *                         type: string
 *                       memberCount:
 *                         type: number
 *                       members:
 *                         type: array
 *                         items:
 *                           type: string
 */
onlineRouter.get('/rooms', AuthMiddleware.authenticateUser, onlineController.getActiveRooms);

export default onlineRouter;