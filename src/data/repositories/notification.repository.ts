import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { PrismaClient } from "@prisma/client";
import {
    INotificationRepository,
    Notification,
} from "../../business/interfaces/notification.interfaces";

@injectable()
export class NotificationRepository implements INotificationRepository {
    private prisma: PrismaClient;

    constructor(
        @inject(TYPES.PrismaClient) prisma: PrismaClient
    ) {
        this.prisma = prisma;
    }
    async getNotifications(params: { take?: number; skip?: number; }): Promise<Notification[]> {
        return this.prisma.notification.findMany({
            take: params.take,
            skip: params.skip,
        });
    }
    async createNotification(notification: Partial<Notification>): Promise<Notification> {
        return this.prisma.notification.create({
            data: {
                ...notification,
            },
        });
    }
    getNotificationById(id: string): Promise<Notification | null> {
        return this.prisma.notification.findUnique({
            where: { id },
        });
    }
    async updateNotification(id: string, notification: Partial<Notification>): Promise<void> {
        await this.prisma.notification.update({
            where: { id },
            data: {
                ...notification,
            },
        });
    }
    async deleteNotification(id: string): Promise<void> {
        await this.prisma.notification.delete({
            where: { id },
        })
    }



}
