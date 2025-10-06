import BaseRouter, { RouteConfig } from "./router";
import { NotificationController } from "@controllers/notifition.controller";
import AuthMiddleware from "../middlewares/auth.middleware";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";

class UserNotificationRouter extends BaseRouter {
    private readonly NotificationController: NotificationController;

    constructor() {
        super();
        this.NotificationController = container.get<NotificationController>(TYPES.NotificationController);
    }

    protected routes(): RouteConfig[] {
        return [

            {
                /**
                 * @swagger
                 * /api/notification:
                 *   post:
                 *     tags: [Notification]
                 *     summary: Create a new notification
                 *     security:
                 *       - bearerAuth: []
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         application/json:
                 *           schema:
                 *             type: object
                 *             properties:
                 *               title:
                 *                 type: string
                 *               message:
                 *                 type: string
                 *               userId:
                 *                 type: string
                 *             required:
                 *               - title
                 *               - message
                 *               - userId
                 *     responses:
                 *       200:
                 *         description: Notification created successfully
                 */
                method: "post",
                handler: (req, res) => this.NotificationController.createNotification(req, res),
                middlewares: [AuthMiddleware.authenticateUser],
                path: ""
            },
            {
                /**
                 * @swagger
                 * /api/notification/{id}:
                 *   get:
                 *     tags: [Notification]
                 *     summary: Get notification by ID
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: id
                 *         schema:
                 *           type: string
                 *         required: true
                 *         description: Notification ID
                 *     responses:
                 *       200:
                 *         description: Notification fetched successfully
                 *       404:
                 *         description: Notification not found
                 */
                method: "get",
                handler: (req, res) => this.NotificationController.getNotificationById(req, res),
                middlewares: [AuthMiddleware.authenticateUser],
                path: "/:id"
            },
            {
                /**
                 * @swagger
                 * /api/notification/{id}:
                 *   put:
                 *     tags: [Notification]
                 *     summary: Update notification by ID
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: id
                 *         schema:
                 *           type: string
                 *         required: true
                 *         description: Notification ID
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         application/json:
                 *           schema:
                 *             type: object
                 *             properties:
                 *               title:
                 *                 type: string
                 *               message:
                 *                 type: string
                 *             required:
                 *               - title
                 *               - message
                 *     responses:
                 *       200:
                 *         description: Notification updated successfully
                 *       404:
                 *         description: Notification not found
                 */
                method: "put",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: (req, res) => this.NotificationController.updateNotification(req, res),
                path: "/:id"
            },
            {
                /**
                 * @swagger
                 * /api/notification/{id}:
                 *   delete:
                 *     tags: [Notification]
                 *     summary: Delete notification by ID
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: id
                 *         schema:
                 *           type: string
                 *         required: true
                 *         description: Notification ID
                 *     responses:
                 *       200:
                 *         description: Notification deleted successfully
                 *       404:
                 *         description: Notification not found
                 */
                method: "delete",
                handler: (req, res) => this.NotificationController.deleteNotification(req, res),
                middlewares: [AuthMiddleware.authenticateUser],
                path: "/:id"
            },
        ];
    }
}
export default new UserNotificationRouter().router;