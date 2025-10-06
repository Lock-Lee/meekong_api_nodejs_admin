import { Message } from './message.types';

export interface Conversation {
    id: string;
    type: string;
    shopId?: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    participants?: ConversationParticipant[];
    messages?: Message[];
}

export interface ConversationParticipant {
    id: string;
    conversationId: string;
    userId: string;
    role: 'USER' | 'SHOP' | 'ADMIN';
    createdAt: Date;
    updatedAt: Date;
    user?: {
        id: string;
        email: string;
        profile?: {
            firstName: string;
            lastName: string;
            avatar: string;
        };
    };
}