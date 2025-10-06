import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "@shared/types/service.types";
import Send from "@utils/response.utils";
import { Logger } from "@utils/logger";
import { BusinessError } from "@shared/errors/business.errors";
import { IMediaService } from "@business/interfaces/media.interfaces";
import {
    mediaPresignBodySchema,
    mediaCompleteBodySchema,
    listItemMediaParamsSchema,
    deleteMediaParamsSchema,
    reorderPrimaryBodySchema,
} from "@api/schemas/media.schemas";

@injectable()
export default class MediaController {
    constructor(
        @inject(TYPES.MediaService) private readonly mediaService: IMediaService
    ) { }

    listItemMedia = async (req: Request, res: Response) => {
        try {
            const paramsValidation = listItemMediaParamsSchema.safeParse(req.params);
            if (!paramsValidation.success) {
                return Send.error(res, paramsValidation.error.issues, "Invalid params", 400);
            }
            const { itemId } = paramsValidation.data;
            const result = await this.mediaService.listItemMedia(itemId);
            return Send.success(res, result, "Media retrieved successfully.");
        } catch (error) {
            Logger.error("Error listing item media", error);
            return Send.error(res, null, "Failed to retrieve media.");
        }
    };

    presign = async (req: Request, res: Response) => {
        try {
            const bodyValidation = mediaPresignBodySchema.safeParse(req.body);
            if (!bodyValidation.success) {
                return Send.error(res, bodyValidation.error.issues, "Invalid request data.", 400);
            }

            const userId = req.userId;
            if (!userId) {
                return Send.error(res, null, "Authentication required.", 401);
            }

            const result = await this.mediaService.presignUpload({ ...bodyValidation.data, userId });
            return Send.success(res, result, "Presigned URL generated.");
        } catch (error) {
            Logger.error("Error presigning media upload", error);
            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }
            return Send.error(res, null, "Failed to presign upload.");
        }
    };

    complete = async (req: Request, res: Response) => {
        try {
            const bodyValidation = mediaCompleteBodySchema.safeParse(req.body);
            if (!bodyValidation.success) {
                return Send.error(res, bodyValidation.error.issues, "Invalid request data.", 400);
            }

            const userId = req.userId;
            if (!userId) {
                return Send.error(res, null, "Authentication required.", 401);
            }

            const media = await this.mediaService.completeUpload({ ...bodyValidation.data, userId });
            return Send.success(res, media, "Upload completed.");
        } catch (error) {
            Logger.error("Error completing media upload", error);
            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }
            return Send.error(res, null, "Failed to complete upload.");
        }
    };

    delete = async (req: Request, res: Response) => {
        try {
            const paramsValidation = deleteMediaParamsSchema.safeParse(req.params);
            if (!paramsValidation.success) {
                return Send.error(res, paramsValidation.error.issues, "Invalid params.", 400);
            }
            const userId = req.userId;
            if (!userId) {
                return Send.error(res, null, "Authentication required.", 401);
            }
            const { mediaId } = paramsValidation.data;
            await this.mediaService.deleteMedia(mediaId, userId);
            return Send.success(res, null, "Media deleted.");
        } catch (error) {
            Logger.error("Error deleting media", error);
            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }
            return Send.error(res, null, "Failed to delete media.");
        }
    };

    reorder = async (req: Request, res: Response) => {
        try {
            const bodyValidation = reorderPrimaryBodySchema.safeParse(req.body);
            if (!bodyValidation.success) {
                return Send.error(res, bodyValidation.error.issues, "Invalid request data.", 400);
            }
            const userId = req.userId;
            if (!userId) {
                return Send.error(res, null, "Authentication required.", 401);
            }
            const { itemId } = req.params as { itemId: string };
            const { primaryImageId } = bodyValidation.data;
            await this.mediaService.setPrimaryImage(itemId, primaryImageId, userId);
            return Send.success(res, null, "Primary image updated.");
        } catch (error) {
            Logger.error("Error reordering media", error);
            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }
            return Send.error(res, null, "Failed to update order.");
        }
    };
}


