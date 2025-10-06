export enum NotificationType {
    INFO = "INFO",
    WARNING = "WARNING",
    ERROR = "ERROR",
}

export enum NotificationPriority {
    LOW = "LOW",
    NORMAL = "NORMAL",
    HIGH = "HIGH",
}

export enum NotificationTarget {
    ALL_USERS = "ALL_USERS",
    SPECIFIC_USERS = "SPECIFIC_USERS",
    USER_ROLE = "USER_ROLE",
    SHOP_OWNERS = "SHOP_OWNERS",
}

export enum NotificationReferenceType {
    ORDER = "ORDER",
    PRODUCT = "PRODUCT",
    USER = "USER",
    OTHER = "OTHER",
}

export enum UserNotificationStatus {
    UNREAD = "UNREAD",
    READ = "READ",
    DISMISSED = "DISMISSED",
}

export interface Notification {
    id: string;
    title: string; // หัวข้อการแจ้งเตือน
    message: string; // เนื้อหาการแจ้งเตือน
    type: NotificationType; // ประเภทการแจ้งเตือน
    priority: NotificationPriority; // ความสำคัญ
    targetType: NotificationTarget; // ส่งให้ใคร
    targetRoles?: string; // JSON array of roles (ถ้า targetType = USER_ROLE)
    imageUrl?: string; // รูปภาพประกอบ
    actionUrl?: string; // URL เมื่อกดการแจ้งเตือน
    actionText?: string; // ข้อความปุ่ม action
    referenceType?: NotificationReferenceType; // ตารางที่เกี่ยวข้อง
    referenceId?: string; // ID ของ entity ที่เกี่ยวข้อง
    isActive: boolean; // เปิดใช้งาน
    scheduleAt?: Date; // กำหนดเวลาส่ง
    expireAt?: Date; // วันหมดอายุ
    createdById?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserNotification {
    id: string;
    userId: string;
    notificationId: string;
    status: UserNotificationStatus; // UNREAD, READ, DISMISSED
    readAt?: Date;
    isPushed: boolean; // ส่ง push notification แล้วหรือยัง
    pushedAt?: Date;
    deviceToken?: string; // FCM/APNS device token
    createdAt: Date;
    updatedAt: Date;
    notification?: Notification;
}

export interface INotificationRepository {
    createNotification(notification: Partial<Notification>): Promise<Notification>;
    getNotificationById(id: string): Promise<Notification | null>;
    updateNotification(id: string, notification: Partial<Notification>): Promise<void>;
    deleteNotification(id: string): Promise<void>;
    getNotifications(params: { take?: number; skip?: number; }): Promise<Notification[]>;
}

export interface INotificationService {
    createNotification(notification: Partial<Notification>): Promise<Notification>;
    getNotificationById(id: string): Promise<Notification | null>;
    updateNotification(id: string, notification: Partial<Notification>): Promise<void>;
    deleteNotification(id: string): Promise<void>;
    getNotifications(params: { take?: number; skip?: number; }): Promise<Notification[]>;
}

