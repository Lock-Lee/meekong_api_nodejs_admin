export enum SocketEvent {
    // Connection events
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',

    // Chat events
    JOIN_ROOM = 'join_room',
    LEAVE_ROOM = 'leave_room',
    NEW_MESSAGE = 'new_message',
    MESSAGE_RECEIVED = 'message_received',
    USER_TYPING = 'user_typing',
    USER_STOP_TYPING = 'user_stop_typing',

    // Status events
    ONLINE_STATUS = 'online_status',
    OFFLINE_STATUS = 'offline_status'
}

export interface ChatMessagePayload {
    conversationId: string;
    message: string;
    messageType?: string;
    attachments?: string;
}

export interface TypingPayload {
    conversationId: string;
    userId: string;
}
