export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    type: 'TEXT' | 'IMAGE' | 'PRODUCT' | 'ORDER';
    attachments?: string;
    readBy: string[];
    createdAt: Date;
    updatedAt: Date;
    sender?: {
        id: string;
        email: string;
        profile?: {
            firstName: string;
            lastName: string;
            avatar: string;
        };
    };
}