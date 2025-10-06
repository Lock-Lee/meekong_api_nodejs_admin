import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { ValidationError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";
import {
    IUserNotificationRepository, IUserNotificationService,
    UserNotification,

} from "../interfaces/user-notification.interfaces";


@injectable()
export class UserNotificationService implements IUserNotificationService {
    constructor(
        @inject(TYPES.UserNotificationRepository) private userNotificationRepository: IUserNotificationRepository
    ) { }
    markNotificationAsRead(userNotificationId: string): Promise<void> {
        Logger.info(`Marking notification ${userNotificationId} as read`);
        if (!userNotificationId) {
            throw new ValidationError("User notification ID is required");
        }
        return this.userNotificationRepository.markNotificationAsRead(userNotificationId);
    }
    getUserNotifications(userId: string, params: { take?: number; skip?: number; }): Promise<UserNotification[]> {
        Logger.info(`Retrieving notifications for user ${userId}`);
        if (!userId) {
            throw new ValidationError("User ID is required");
        }
        return this.userNotificationRepository.getUserNotifications(userId, params);
    }


}
