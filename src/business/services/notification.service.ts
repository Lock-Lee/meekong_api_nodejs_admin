import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { ValidationError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";
import {
    INotificationService,
    Notification,
    INotificationRepository
} from "../interfaces/notification.interfaces";


@injectable()
export class NotificationService implements INotificationService {
    constructor(
        @inject(TYPES.UserNotificationRepository) private userNotificationRepository: INotificationRepository
    ) { }
    getNotifications(_params: { take?: number; skip?: number; }): Promise<Notification[]> {
        throw new Error("Method not implemented.");
    }
    createNotification(notification: Partial<Notification>): Promise<Notification> {
        Logger.info("Creating notification", { notification });
        if (!notification) {
            throw new ValidationError("Notification data is required");
        }
        return this.userNotificationRepository.createNotification(notification);
    }
    getNotificationById(id: string): Promise<Notification | null> {
        Logger.info(`Retrieving notification by id: ${id}`);
        if (!id) {
            throw new ValidationError("Notification ID is required");
        }
        return this.userNotificationRepository.getNotificationById(id);
    }
    updateNotification(id: string, notification: Partial<Notification>): Promise<void> {
        Logger.info(`Updating notification ${id}`, { notification });
        if (!id) {
            throw new ValidationError("Notification ID is required");
        }
        if (!notification) {
            throw new ValidationError("Notification data is required");
        }
        return this.userNotificationRepository.updateNotification(id, notification);
    }
    deleteNotification(id: string): Promise<void> {
        Logger.info(`Deleting notification ${id}`);
        if (!id) {
            throw new ValidationError("Notification ID is required");
        }
        return this.userNotificationRepository.deleteNotification(id);
    }



}
