import { Request, Response } from "express";
import Send from "@utils/response.utils";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import { Logger } from "../../shared/utils/logger";
import { IUserNotificationService } from "../../business/interfaces/user-notification.interfaces";
import { injectable } from "inversify";

@injectable()
export class UserNotificationController {
  private userNotificationService: IUserNotificationService;
  constructor() {
    this.userNotificationService = container.get<IUserNotificationService>(TYPES.UserNotificationService);
  }

  async getUserNotifications(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Fetching all user notifications", { requestId: req.id });

      const userNotifications = await this.userNotificationService.getUserNotifications(req.params.userId, {
        take: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
        skip: req.query.page ? (parseInt(req.query.page as string, 10) - 1) * (req.query.limit ? parseInt(req.query.limit as string, 10) : 10) : 0,
      });

      Logger.info("User notifications retrieved successfully", {
        userNotificationCount: userNotifications.length,
        requestId: req.id
      });

      return Send.success(res, userNotifications, "User notifications fetched successfully.");
    } catch (error) {
      Logger.error("Failed to fetch user notifications", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

  async markNotificationAsRead(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Marking notification as read", { requestId: req.id });
      await this.userNotificationService.markNotificationAsRead(req.params.userNotificationId);

      Logger.info("Notification marked as read successfully", {
        userNotificationId: req.params.userNotificationId,
        requestId: req.id
      });

      return Send.success(res, null, "Notification marked as read.");
    } catch (error) {
      Logger.error("Failed to mark notification as read", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

}