import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import {
    IRefreshSessionRepository,
    RefreshSession,
    CreateRefreshSessionData,
} from "../../business/interfaces/auth.interfaces";

@injectable()
export class RefreshSessionRepository implements IRefreshSessionRepository {
    constructor(
        @inject(TYPES.PrismaClient) private prisma: any
    ) { }

    async create(sessionData: CreateRefreshSessionData): Promise<RefreshSession> {
        const session = await this.prisma.refreshSession.create({
            data: {
                userId: sessionData.userId,
                token: sessionData.token,
                expiresAt: sessionData.expiresAt,
            },
        });

        return {
            id: session.id,
            userId: session.userId,
            token: session.token,
            expiresAt: session.expiresAt,
            revoked: session.revoked,
            createdAt: session.createdAt,
        };
    }

    async findValidSession(userId: string, token: string): Promise<RefreshSession | null> {
        const session = await this.prisma.refreshSession.findFirst({
            where: {
                token,
                userId,
                revoked: false,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });

        if (!session) return null;

        return {
            id: session.id,
            userId: session.userId,
            token: session.token,
            expiresAt: session.expiresAt,
            revoked: session.revoked,
            createdAt: session.createdAt,
        };
    }

    async revokeByToken(token: string): Promise<void> {
        await this.prisma.refreshSession.updateMany({
            where: { token },
            data: { revoked: true },
        });
    }

    async revokeAllUserSessions(userId: string): Promise<void> {
        await this.prisma.refreshSession.updateMany({
            where: { userId },
            data: { revoked: true },
        });
    }
}
