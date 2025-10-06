import { getFirebaseMessaging } from "./firebase.client";

export interface NotificationPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
}

export class FirebaseNotificationService {
    private messaging = getFirebaseMessaging();

    /**
     * ส่งแจ้งเตือนไปที่ device token
     */
    async sendToDevice(token: string, payload: NotificationPayload) {
        const message = {
            token,
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: payload.data || {},
        };

        return this.messaging.send(message);
    }

    /**
     * ส่งแจ้งเตือนไปที่ topic
     */
    async sendToTopic(topic: string, payload: NotificationPayload) {
        const message = {
            topic,
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: payload.data || {},
        };

        return this.messaging.send(message);
    }
}
