import { Request, Response } from "express";
import { injectable } from "inversify";
import Send from "@utils/response.utils";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import { IProfileService } from "../../business/interfaces/profile.interfaces";
import profileSchema from "@schemas/profile.schemas";
import { UploadedFile } from "express-fileupload";
import { BusinessError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";

@injectable()
export class ProfileController {
  private profileService: IProfileService;

  constructor() {
    this.profileService = container.get<IProfileService>(TYPES.ProfileService);
  }

  /**
   * Get user profile by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const paramsValidation = profileSchema.getProfileByIdParams.safeParse(req.params);
      if (!paramsValidation.success) {
        Logger.warn("Invalid parameters for profile retrieval", {
          errors: paramsValidation.error.issues,
          requestId: req.id
        });
        return Send.error(res, paramsValidation.error.issues, "Invalid parameters.");
      }

      const { id } = paramsValidation.data;

      Logger.info("Fetching user profile", { userId: id, requestId: req.id });

      const userProfile = await this.profileService.getProfileById(id);

      if (!userProfile) {
        Logger.warn("User not found", { userId: id, requestId: req.id });
        return Send.error(res, null, "User not found.");
      }

      Logger.info("User profile retrieved successfully", {
        userId: id,
        requestId: req.id
      });

      return Send.success(res, userProfile, "Profile retrieved successfully.");
    } catch (error) {
      Logger.error("Failed to get profile", {
        error: (error as Error).message,
        userId: req.params?.id,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Failed to retrieve profile.");
    }
  }

  /**
   * Update user profile
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const paramsValidation = profileSchema.getProfileByIdParams.safeParse(req.params);
      if (!paramsValidation.success) {
        Logger.warn("Invalid parameters for profile update", {
          errors: paramsValidation.error.issues,
          requestId: req.id
        });
        return Send.error(res, paramsValidation.error.issues, "Invalid parameters.");
      }

      const bodyValidation = profileSchema.updateProfile.safeParse(req.body);
      if (!bodyValidation.success) {
        Logger.warn("Invalid request body for profile update", {
          errors: bodyValidation.error.errors,
          requestId: req.id
        });
        return Send.error(res, bodyValidation.error.errors, "Invalid request body.");
      }

      const { id } = paramsValidation.data;
      const profileData = bodyValidation.data;
      const image = req.files?.image as UploadedFile | undefined;

      Logger.info("Updating user profile", {
        userId: id,
        hasImage: !!image,
        updatedFields: Object.keys(profileData),
        requestId: req.id
      });

      const updateRequest = {
        ...profileData,
        image,
      };

      const updatedUser = await this.profileService.updateProfile(id, updateRequest);

      Logger.info("User profile updated successfully", {
        userId: id,
        requestId: req.id
      });

      return Send.success(res, updatedUser, "Profile updated successfully.");
    } catch (error) {
      Logger.error("Failed to update profile", {
        error: (error as Error).message,
        userId: req.params?.id,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, error, "An internal server error occurred.");
    }
  }
}

export default ProfileController;