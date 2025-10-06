import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { ImageType } from "../../../generated/prisma";
import {
    IProfileRepository,
    UserData,
    ProfileData,
    ProfileImageData
} from "../../business/interfaces/profile.interfaces";

@injectable()
export class ProfileRepository implements IProfileRepository {
    constructor(
        @inject(TYPES.PrismaClient) private prisma: any
    ) { }

    /**
     * Find user by ID with profile
     */
    async findUserById(id: string): Promise<UserData | null> {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { profile: true },
        });

        return user ? this.mapToUserData(user) : null;
    }

    /**
     * Update user data
     */
    async updateUser(id: string, data: { email?: string; phone?: string }): Promise<void> {
        const updateData: any = {};
        if (data.email) updateData.email = data.email;
        if (data.phone) updateData.phone = data.phone;

        if (Object.keys(updateData).length > 0) {
            await this.prisma.user.update({
                where: { id },
                data: updateData,
            });
        }
    }

    /**
     * Create or update profile
     */
    async upsertProfile(userId: string, data: Partial<ProfileData>): Promise<ProfileData> {
        const updateData: any = {};
        if (data.firstName) updateData.firstName = data.firstName;
        if (data.lastName) updateData.lastName = data.lastName;
        if (data.gender) updateData.gender = data.gender;
        if (data.birthDate) updateData.birthDate = data.birthDate;
        if (data.avatarUrl) updateData.avatarUrl = data.avatarUrl;

        const profile = await this.prisma.userProfile.upsert({
            where: { userId },
            update: updateData,
            create: {
                userId,
                ...updateData,
            },
        });

        return this.mapToProfileData(profile);
    }

    /**
     * Find profile image
     */
    async findProfileImage(userId: string): Promise<ProfileImageData | null> {
        const image = await this.prisma.image.findFirst({
            where: {
                targetId: userId,
                type: ImageType.PROFILE,
                isPrimary: true,
            },
        });

        return image ? this.mapToProfileImageData(image) : null;
    }

    /**
     * Create profile image
     */
    async createProfileImage(data: Omit<ProfileImageData, 'id'>): Promise<ProfileImageData> {
        const image = await this.prisma.image.create({
            data: {
                imageUrl: data.imageUrl,
                type: ImageType.PROFILE,
                targetId: data.targetId,
                isPrimary: data.isPrimary,
                createdById: data.createdById,
            },
        });

        return this.mapToProfileImageData(image);
    }

    /**
     * Update profile images primary status
     */
    async updateProfileImagesPrimary(userId: string, newPrimaryImageId: string): Promise<void> {
        await this.prisma.$transaction(async (tx: any) => {
            // Set all existing profile images to not primary
            await tx.image.updateMany({
                where: {
                    targetId: userId,
                    type: ImageType.PROFILE,
                },
                data: { isPrimary: false },
            });

            // Set the new image as primary
            await tx.image.update({
                where: { id: newPrimaryImageId },
                data: { isPrimary: true },
            });
        });
    }

    // Mappers
    private mapToUserData(user: any): UserData {
        return {
            id: user.id,
            email: user.email,
            phone: user.phone,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            profile: user.profile ? this.mapToProfileData(user.profile) : undefined,
        };
    }

    private mapToProfileData(profile: any): ProfileData {
        return {
            userId: profile.userId,
            firstName: profile.firstName,
            lastName: profile.lastName,
            gender: profile.gender,
            birthDate: profile.birthDate,
            avatarUrl: profile.avatarUrl,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
        };
    }

    private mapToProfileImageData(image: any): ProfileImageData {
        return {
            id: image.id,
            imageUrl: image.imageUrl,
            targetId: image.targetId,
            isPrimary: image.isPrimary,
            createdById: image.createdById,
        };
    }
}
