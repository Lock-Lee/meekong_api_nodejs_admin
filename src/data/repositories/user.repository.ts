import { injectable, inject } from "inversify";
import { v7 as uuidv7 } from "uuid";
import { TYPES } from "../../shared/types/service.types";
import { AuthProvider } from "../../../generated/prisma";
import {
    IUserRepository,
    UserAuthDetails,
    CreateUserData,
    CreateUserDeviceData,
    UpdateUserDeviceFirebaseTokenData,
    CreateSocialUserData,
} from "../../business/interfaces/auth.interfaces";

@injectable()
export class UserRepository implements IUserRepository {
    constructor(
        @inject(TYPES.PrismaClient) private prisma: any
    ) { }
    async createUserDevice(data: CreateUserDeviceData): Promise<any> {
        return this.prisma.userDevice.create({
            data: {
                id: uuidv7(),
                userId: data.userId,
                deviceId: data.deviceId,
                firebaseToken: data.firebaseToken,
            },
        });
    }

    async updateUserDeviceFirebaseToken(data: UpdateUserDeviceFirebaseTokenData): Promise<void> {
        await this.prisma.userDevice.updateMany({
            where: {
                userId: data.userId,
                deviceId: data.deviceId,
            },
            data: {
                firebaseToken: data.firebaseToken,
            },
        });
    }

    async findUserDevice(userId: string, deviceId: string): Promise<any> {
        return this.prisma.userDevice.findFirst({
            where: {
                userId,
                deviceId,
            },
        });
    }

    async findByEmail(email: string): Promise<UserAuthDetails | null> {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                profile: true,
            },
        });

        if (!user) return null;

        return {
            id: user.id,
            email: user.email,
            profile: user.profile ? {
                firstName: user.profile.firstName,
                lastName: user.profile.lastName,
            } : undefined,
        };
    }

    async findByPhone(phone: string): Promise<UserAuthDetails | null> {
        const user = await this.prisma.user.findUnique({
            where: { phone },
            include: {
                profile: true,
            },
        });

        if (!user) return null;

        return {
            id: user.id,
            email: user.email,
            profile: user.profile ? {
                firstName: user.profile.firstName,
                lastName: user.profile.lastName,
            } : undefined,
        };
    }

    async findByEmailWithAuth(email: string): Promise<any> {
        return this.prisma.userAuth.findFirst({
            where: {
                provider: AuthProvider.PASSWORD,
                user: { email },
            },
            include: {
                user: {
                    include: { profile: true }
                },
            },
        });
    }

    async create(userData: CreateUserData): Promise<UserAuthDetails> {
        const user = await this.prisma.user.create({
            data: {
                id: uuidv7(),
                email: userData.email,
                phone: userData.phone,
                roles: {
                    set: userData.roles,
                },
                profile: {
                    create: {
                        firstName: userData.profile.firstName,
                        lastName: userData.profile.lastName,
                    },
                },
                authentications: {
                    create: {
                        provider: userData.authentication.provider,
                        providerId: userData.authentication.providerId,
                        passwordHash: userData.authentication.passwordHash,
                    },
                },
            },
            include: {
                profile: true
            },
        });

        return {
            id: user.id,
            email: user.email,
            profile: user.profile ? {
                firstName: user.profile.firstName,
                lastName: user.profile.lastName,
            } : undefined,
        };
    }

    async findById(id: string): Promise<UserAuthDetails | null> {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                profile: true,
            },
        });

        if (!user) return null;

        return {
            id: user.id,
            email: user.email,
            profile: user.profile ? {
                firstName: user.profile.firstName,
                lastName: user.profile.lastName,
            } : undefined,
        };
    }

    async findByProviderId(provider: AuthProvider, providerId: string): Promise<any> {
        return this.prisma.userAuth.findFirst({
            where: {
                provider,
                providerId,
            },
            include: {
                user: {
                    include: { profile: true }
                },
            },
        });
    }

    async createSocialUser(userData: CreateSocialUserData): Promise<UserAuthDetails> {
        const user = await this.prisma.user.create({
            data: {
                id: uuidv7(),
                email: userData.email,
                phone: userData.phone,
                roles: {
                    set: userData.roles,
                },
                profile: {
                    create: {
                        firstName: userData.profile.firstName,
                        lastName: userData.profile.lastName,
                        avatarUrl: userData.profile.avatarUrl,
                    },
                },
                authentications: {
                    create: {
                        provider: userData.authentication.provider,
                        providerId: userData.authentication.providerId,
                        accessToken: userData.authentication.accessToken,
                        refreshToken: userData.authentication.refreshToken,
                    },
                },
            },
            include: {
                profile: true
            },
        });

        return {
            id: user.id,
            email: user.email,
            profile: user.profile ? {
                firstName: user.profile.firstName,
                lastName: user.profile.lastName,
            } : undefined,
        };
    }

    async updateEmail(userId: string, email: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: { email },
        });
    }

    async updatePassword(userId: string, hashedPassword: string): Promise<void> {
        // Update password in UserAuth table for PASSWORD provider
        await this.prisma.userAuth.updateMany({
            where: {
                userId: userId,
                provider: AuthProvider.PASSWORD,
            },
            data: {
                passwordHash: hashedPassword,
            },
        });
    }
}
