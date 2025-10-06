import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { PrismaClient } from "@prisma/client";
import {
    IUserNotificationRepository,
    UserNotification
} from "../../business/interfaces/user-notification.interfaces";

@injectable()
export class UserNotificationRepository implements IUserNotificationRepository {
    private prisma: PrismaClient;

    constructor(
        @inject(TYPES.PrismaClient) prisma: PrismaClient
    ) {
        this.prisma = prisma;
    }
    markNotificationAsRead(userNotificationId: string): Promise<void> {
        return this.prisma.userNotification.update({
            where: { id: userNotificationId },
            data: {
                status: "READ",
                readAt: new Date(),
            },
        });
    }
    getUserNotifications(userId: string, params: { take?: number; skip?: number; }): Promise<UserNotification[]> {
        const { take = 10, skip = 0 } = params;
        return this.prisma.userNotification.findMany({
            where: { userId },
            include: { notification: true },
            orderBy: { createdAt: 'desc' },
            take,
            skip,
        });
    }


}
