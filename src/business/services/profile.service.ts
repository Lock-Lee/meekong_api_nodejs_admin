import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { UploadedFile } from "express-fileupload";
import { v7 as uuidv7 } from "uuid";
import path from "path";
import fs from "fs/promises";
import {
    IProfileService,
    IProfileRepository,
    UserData,
    UpdateProfileRequest,
    UploadImageResult
} from "../interfaces/profile.interfaces";
import { ValidationError, BusinessError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";

@injectable()
export class ProfileService implements IProfileService {
    constructor(
        @inject(TYPES.ProfileRepository) private profileRepository: IProfileRepository
    ) { }

    /**
     * Get user profile by ID
     */
    async getProfileById(id: string): Promise<UserData | null> {
        Logger.info("Fetching user profile", { userId: id });

        const user = await this.profileRepository.findUserById(id);

        if (!user) {
            Logger.warn("User not found", { userId: id });
            return null;
        }

        // Get profile image if exists
        const profileImage = await this.profileRepository.findProfileImage(user.id);
        if (profileImage && user.profile) {
            user.profile.avatarUrl = profileImage.imageUrl || user.profile.avatarUrl;
        }

        Logger.info("User profile retrieved successfully", {
            userId: id,
            hasProfile: !!user.profile
        });

        return user;
    }

    /**
     * Update user profile
     */
    async updateProfile(id: string, request: UpdateProfileRequest): Promise<UserData> {
        Logger.info("Updating user profile", { userId: id });

        // 1. Validate request
        this.validateProfileData(request);

        // 2. Check if user exists
        const existingUser = await this.profileRepository.findUserById(id);
        if (!existingUser) {
            throw new BusinessError("User not found", "NOT_FOUND");
        }

        // 3. Upload image if provided
        let imageUrl: string | undefined;
        let imageId: string | undefined;
        if (request.image) {
            const uploadResult = await this.uploadProfileImage(request.image);
            imageUrl = uploadResult.imageUrl;
            imageId = uploadResult.imageId;
        }

        // 4. Update user data
        const userUpdateData: any = {};
        if (request.email) userUpdateData.email = request.email;
        if (request.phone) userUpdateData.phone = request.phone;

        if (Object.keys(userUpdateData).length > 0) {
            await this.profileRepository.updateUser(id, userUpdateData);
        }

        // 5. Update profile data
        const profileUpdateData: any = {};
        if (request.firstName) profileUpdateData.firstName = request.firstName;
        if (request.lastName) profileUpdateData.lastName = request.lastName;
        if (request.gender) profileUpdateData.gender = request.gender; // แก้จาก sex เป็น gender
        if (request.birthDate) profileUpdateData.birthDate = new Date(request.birthDate); // แก้จาก birthdate เป็น birthDate
        if (imageUrl) profileUpdateData.avatarUrl = imageUrl;

        if (Object.keys(profileUpdateData).length > 0) {
            await this.profileRepository.upsertProfile(id, profileUpdateData);
        }

        // 6. Create image record if image was uploaded
        if (imageUrl && imageId) {
            await this.profileRepository.updateProfileImagesPrimary(id, imageId);
            await this.profileRepository.createProfileImage({
                imageUrl,
                targetId: id,
                isPrimary: true,
                createdById: id,
            });
        }

        // 7. Return updated user
        const updatedUser = await this.profileRepository.findUserById(id);

        Logger.info("User profile updated successfully", {
            userId: id,
            updatedFields: Object.keys({ ...userUpdateData, ...profileUpdateData })
        });

        return updatedUser!;
    }

    /**
     * Upload profile image
     */
    async uploadProfileImage(image: UploadedFile): Promise<UploadImageResult> {
        Logger.info("Uploading profile image", { filename: image.name, size: image.size });

        // Validate image
        this.validateImageFile(image);

        const uploadPath = path.join(process.cwd(), "public/images/profiles");
        await fs.mkdir(uploadPath, { recursive: true });

        const newImageId = uuidv7();
        const fileExtension = path.extname(image.name);
        const newFileName = `${newImageId}${fileExtension}`;
        const filePath = path.join(uploadPath, newFileName);

        await image.mv(filePath);

        const imageUrl = `/images/profiles/${newFileName}`;

        Logger.info("Profile image uploaded successfully", {
            filename: newFileName,
            imageUrl
        });

        return {
            imageUrl,
            filePath,
            imageId: newImageId,
        };
    }

    /**
     * Validate profile data
     */
    validateProfileData(data: UpdateProfileRequest): void {
        if (data.email && !this.isValidEmail(data.email)) {
            throw new ValidationError("Invalid email format");
        }

        if (data.birthDate && !this.isValidDate(data.birthDate)) {
            throw new ValidationError("Invalid birthDate format");
        }
    }

    // Private helper methods
    private validateImageFile(file: UploadedFile): void {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(file.mimetype)) {
            throw new ValidationError(
                `Invalid image format. Allowed formats: ${allowedTypes.join(', ')}`
            );
        }

        if (file.size > maxSize) {
            throw new ValidationError(
                `Image size too large. Maximum size: ${maxSize / (1024 * 1024)}MB`
            );
        }
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private isValidDate(dateString: string): boolean {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    }
}
