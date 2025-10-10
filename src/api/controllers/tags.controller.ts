import { Request, Response } from "express";
import { injectable } from "inversify";
import Send from "@utils/response.utils";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";

import { BusinessError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";
import tagSchema from "@api/schemas/tag.schema";
import { ITagMasterService } from "@business/interfaces/tag.interfaces";

@injectable()
export class TagController {
    private TagService: ITagMasterService;

    constructor() {
        this.TagService = container.get<ITagMasterService>(TYPES.TagService);
    }

    /**
     * Get all tag with hierarchy
     */
    async getAll(req: Request, res: Response): Promise<void> {
        try {
            Logger.info("Fetching all tag", { requestId: req.id });

            const tag = await this.TagService.getAlltag();

            Logger.info("tag retrieved successfully", {
                TagCount: tag?.length,
                requestId: req.id
            });

            return Send.success(res, tag, "tag fetched successfully.");
        } catch (error) {
            Logger.error("Failed to fetch tag", {
                error: (error as Error).message,
                requestId: req.id
            });

            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }

            return Send.error(res, null, "Failed to fetch tag.");
        }
    }

    /**
     * Get Tag by ID with children
     */
    async getById(req: Request, res: Response): Promise<void> {
        try {
            const paramsValidation = tagSchema.getTagByIdParams.safeParse(req.params);
            if (!paramsValidation.success) {
                Logger.warn("Invalid parameters for Tag retrieval", {
                    errors: paramsValidation.error.issues,
                    requestId: req.id
                });
                return Send.error(res, paramsValidation.error.issues, "Invalid parameters.");
            }

            const { id } = paramsValidation.data;

            Logger.info("Fetching Tag by ID", { TagId: id, requestId: req.id });

            const Tag = await this.TagService.getTagById(id);

            if (!Tag) {
                Logger.warn("Tag not found", { TagId: id, requestId: req.id });
                return Send.error(res, null, "Tag not found.");
            }

            Logger.info("Tag retrieved successfully", {
                TagId: id,
                TagName: Tag.name,
                requestId: req.id
            });

            return Send.success(res, Tag, "Tag fetched successfully.");
        } catch (error) {
            Logger.error("Failed to fetch Tag by ID", {
                error: (error as Error).message,
                TagId: req.params?.id,
                requestId: req.id
            });

            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }

            return Send.error(res, null, "Failed to fetch Tag.");
        }
    }


    /**
     * Create a new Tag
     */
    async create(req: Request, res: Response): Promise<void> {
        try {
            const body = {
                ...req.body,
                level: parseInt(req.body.level)
            }
            const bodyValidation = tagSchema.createTag.safeParse(body);
            if (!bodyValidation.success) {
                Logger.warn("Invalid request body for Tag creation", {
                    errors: bodyValidation.error.errors,
                    requestId: req.id
                });
                return Send.error(res, bodyValidation.error.errors, "Invalid request body.");
            }
            const TagData = { ...bodyValidation.data };

            Logger.info("Creating new Tag", {
                name: TagData.name,
                requestId: req.id
            });

            const newTag = await this.TagService.createTagMaster(TagData);

            Logger.info("Tag created successfully", {
                TagId: newTag?.id,
                name: newTag?.name,

                requestId: req.id
            });

            return Send.success(res, newTag, "Tag created successfully.");
        } catch (error) {
            Logger.error("Failed to create Tag", {
                error: (error as Error).message,
                TagName: req.body?.nameTh || req.body?.nameEn,
                requestId: req.id
            });

            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }

            return Send.error(res, null, "Failed to create Tag.");
        }
    }

    // async upsertMany(req: Request, res: Response): Promise<void> {
    //     try {
    //         const rawItems = Array.isArray(req.body)
    //             ? req.body
    //             : (req.body?.items ? JSON.parse(req.body.items) : []);

    //         if (!Array.isArray(rawItems) || rawItems.length === 0) {
    //             return Send.error(res, null, "Items must be a non-empty array.", 400);
    //         }

    //         const prepared = rawItems.map((it) => ({
    //             ...it,
    //             level: typeof it.level === "string" ? parseInt(it.level) : it.level,
    //         }));

    //         const failures: Array<{ index: number; errors: unknown }> = [];
    //         const validItems: any[] = [];
    //         for (let i = 0; i < prepared.length; i++) {
    //             const it = prepared[i];
    //             const r = it.id
    //                 ? tagSchema.updateTag.safeParse(it) // <- ensure you have this; otherwise create a union that allows id
    //                 : tagSchema.createTag.safeParse(it);

    //             if (!r.success) failures.push({ index: i, errors: r.error.errors });
    //             else validItems.push(r.data);
    //         }

    //         if (failures.length) {
    //             Logger.warn("Invalid items in bulk Tag upsert", { failures, requestId: req.id });
    //             return Send.error(res, failures, "Some items are invalid.");
    //         }


    //         Logger.info("Bulk upserting tag", { count: validItems.length, requestId: req.id });

    //         const upserted = await this.TagService.upsertManytag(validItems);

    //         Logger.info("Bulk tag upserted", { count: upserted.length, requestId: req.id });

    //         return Send.success(res, upserted, "tag upserted successfully.");
    //     } catch (error) {
    //         Logger.error("Failed to bulk upsert tag", {
    //             error: (error as Error).message,
    //             requestId: req.id,
    //         });

    //         if (error instanceof BusinessError) {
    //             return Send.error(res, null, error.message, error.statusCode);
    //         }
    //         return Send.error(res, null, "Failed to bulk upsert tag.");
    //     }
    // }

}

export default TagController;