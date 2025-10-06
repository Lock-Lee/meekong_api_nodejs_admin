import { UploadedFile } from "express-fileupload";
import { Gender } from "../../../generated/prisma";

export interface ProfileData {
    userId: string;
    firstName?: string;
    lastName?: string;
    gender?: Gender;
    birthDate?: Date;
    avatarUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserData {
    id: string;
    email: string;
    phone?: string;
    createdAt: Date;
    updatedAt: Date;
    profile?: ProfileData;
}

export interface UpdateProfileRequest {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    sex?: Gender;
    birthdate?: string;
    image?: UploadedFile;
}

export interface ProfileImageData {
    id: string;
    imageUrl: string;
    targetId: string;
    isPrimary: boolean;
    createdById: string;
}

export interface UploadImageResult {
    imageUrl: string;
    filePath: string;
    imageId: string;
}

/**
 * Repository interface for profile-related data operations
 */
export interface IProfileRepository {
    // User operations
    findUserById(id: string): Promise<UserData | null>;
    updateUser(id: string, data: { email?: string; phone?: string }): Promise<void>;

    // Profile operations
    upsertProfile(userId: string, data: Partial<ProfileData>): Promise<ProfileData>;

    // Image operations
    findProfileImage(userId: string): Promise<ProfileImageData | null>;
    createProfileImage(data: Omit<ProfileImageData, 'id'>): Promise<ProfileImageData>;
    updateProfileImagesPrimary(userId: string, newPrimaryImageId: string): Promise<void>;
}

/**
 * Service interface for profile business logic
 */
export interface IProfileService {
    // Profile operations
    getProfileById(id: string): Promise<UserData | null>;
    updateProfile(id: string, request: UpdateProfileRequest): Promise<UserData>;

    // Image operations
    uploadProfileImage(image: UploadedFile): Promise<UploadImageResult>;

    // Validation
    validateProfileData(data: UpdateProfileRequest): void;
}
