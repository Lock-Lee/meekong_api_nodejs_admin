import { Request, Response } from "express";
import Send from "@utils/response.utils";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import { Logger } from "../../shared/utils/logger";
import { INotificationService } from "../../business/interfaces/notification.interfaces";
import { injectable } from "inversify";

@injectable()
export class NotificationController {
  private userNotificationService: INotificationService;
  constructor() {
    this.userNotificationService = container.get<INotificationService>(TYPES.NotificationService);
  }

  async createNotification(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Creating notification", { requestId: req.id });
      const notification = await this.userNotificationService.createNotification(req.body);

      Logger.info("Notification created successfully", {
        notificationId: notification.id,
        requestId: req.id
      });

      return Send.success(res, notification, "Notification created successfully.");
    } catch (error) {
      Logger.error("Failed to create notification", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

  async getNotificationById(req: Request, res: Response): Promise<void> {
    try {
      Logger.info(`Fetching notification by id: ${req.params.id}`, { requestId: req.id });
      const notification = await this.userNotificationService.getNotificationById(req.params.id);

      if (!notification) {
        Logger.warn(`Notification not found with id: ${req.params.id}`, { requestId: req.id });
        return Send.notFound(res, "Notification not found.");
      }

      Logger.info("Notification retrieved successfully", {
        notificationId: notification.id,
        requestId: req.id
      });

      return Send.success(res, notification, "Notification fetched successfully.");
    } catch (error) {
      Logger.error("Failed to fetch notification", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

  async updateNotification(req: Request, res: Response): Promise<void> {
    try {
      Logger.info(`Updating notification ${req.params.id}`, { requestId: req.id });
      await this.userNotificationService.updateNotification(req.params.id, req.body);

      Logger.info("Notification updated successfully", {
        notificationId: req.params.id,
        requestId: req.id
      });

      return Send.success(res, null, "Notification updated successfully.");
    } catch (error) {
      Logger.error("Failed to update notification", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      Logger.info(`Deleting notification ${req.params.id}`, { requestId: req.id });
      await this.userNotificationService.deleteNotification(req.params.id);

      Logger.info("Notification deleted successfully", {
        notificationId: req.params.id,
        requestId: req.id
      });

      return Send.success(res, null, "Notification deleted successfully.");
    } catch (error) {
      Logger.error("Failed to delete notification", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }
  async getAllNotifications(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Fetching all notifications", { requestId: req.id });

      const notifications = await this.userNotificationService.getNotifications({
        take: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
        skip: req.query.page ? (parseInt(req.query.page as string, 10) - 1) * (req.query.limit ? parseInt(req.query.limit as string, 10) : 10) : 0,
      });

      Logger.info("Notifications retrieved successfully", {
        notificationCount: notifications.length,
        requestId: req.id
      });

      return Send.success(res, notifications, "Notifications fetched successfully.");
    } catch (error) {
      Logger.error("Failed to fetch notifications", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

}