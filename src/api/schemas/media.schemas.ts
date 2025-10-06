import { z } from "zod";
import { MediaType } from "../../../generated/prisma";

export const listItemMediaParamsSchema = z.object({
    itemId: z.string().uuid("Invalid item ID"),
});

export const mediaPresignBodySchema = z.object({
    itemId: z.string().uuid("Invalid item ID"),
    type: z.nativeEnum(MediaType), // IMAGE | VIDEO
    contentType: z.string().min(1),
    fileName: z.string().min(1),
    size: z.number().positive(),
    multipart: z.boolean().optional(),
});

export const mediaCompleteBodySchema = z.object({
    itemId: z.string().uuid("Invalid item ID"),
    type: z.nativeEnum(MediaType),
    key: z.string().min(1),
    size: z.number().positive().optional(),
    contentType: z.string().min(1).optional(),
    uploadId: z.string().optional(),
    parts: z
        .array(
            z.object({
                partNumber: z.number().int().positive(),
                etag: z.string().min(1),
            })
        )
        .optional(),
});

export const deleteMediaParamsSchema = z.object({
    mediaId: z.string().uuid("Invalid media ID"),
});

export const reorderPrimaryBodySchema = z.object({
    primaryImageId: z.string().uuid("Invalid image ID"),
});

export default {
    listItemMediaParams: listItemMediaParamsSchema,
    mediaPresignBody: mediaPresignBodySchema,
    mediaCompleteBody: mediaCompleteBodySchema,
    deleteMediaParams: deleteMediaParamsSchema,
    reorderPrimaryBody: reorderPrimaryBodySchema,
};


