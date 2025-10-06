import BaseRouter, { RouteConfig } from "./router";
import { UserNotificationController } from "@controllers/userNotifition.controller";
import AuthMiddleware from "../middlewares/auth.middleware";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";

class UserNotificationRouter extends BaseRouter {
    private readonly userNotificationController: UserNotificationController;

    constructor() {
        super();
        this.userNotificationController = container.get<UserNotificationController>(TYPES.UserNotificationController);
    }

    protected routes(): RouteConfig[] {
        return [
            {
                /**
                 * @swagger
                 * /api/user-notification:
                 *   get:
                 *     tags: [User Notification]
                 *     summary: Get all user notifications
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: query
                 *         name: userId
                 *         schema:
                 *           type: string
                 *         required: true
                 *         description: User ID
                 *       - in: query
                 *         name: take
                 *         schema:
                 *           type: integer
                 *         required: false
                 *         description: Limit number of notifications
                 *       - in: query
                 *         name: skip
                 *         schema:
                 *           type: integer
                 *         required: false
                 *         description: Number of notifications to skip
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 */
                method: "get",
                path: "/",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.userNotificationController.getUserNotifications.bind(this.userNotificationController),
            },
            {
                /**
                 * @swagger
                 * /api/user-notification/{id}/read:
                 *   patch:
                 *     tags: [User Notification]
                 *     summary: Mark user notification as read
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: id
                 *         schema:
                 *           type: string
                 *         required: true
                 *         description: User notification ID
                 *     responses:
                 *       200:
                 *         description: Notification marked as read
                 */
                method: "patch",
                path: "/:id/read",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.userNotificationController.markNotificationAsRead.bind(this.userNotificationController),
            },



        ];
    }
}
export default new UserNotificationRouter().router;