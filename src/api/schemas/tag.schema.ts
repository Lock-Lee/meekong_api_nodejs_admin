import { z } from "zod";

export const getTagByIdParamsSchema = z.object({
    id: z.string().uuid("Invalid Tag ID format"),
});


export const createTagBodySchema = z.object({
    name: z.string().min(1, "Thai name is required"),
    tagLinks: z.array(
        z.object({
            id: z.string().uuid("TagLink id must be a valid UUID"),
        })
    ).optional(),

    TagUsage: z.array(
        z.object({
            id: z.string().uuid("TagUsage id must be a valid UUID"),
        })
    ).optional(),
});

export const updateTagBodySchema = z.object({
    name: z.string().min(1, "Thai name is required"),
    tagLinks: z.array(
        z.object({
            id: z.string().uuid("TagLink id must be a valid UUID"),
        })
    ).optional(),

    TagUsage: z.array(
        z.object({
            id: z.string().uuid("TagUsage id must be a valid UUID"),
        })
    ).optional(),
});

export const updateTagParamsSchema = z.object({
    id: z.string().uuid("Invalid Tag ID format"),
});

export default {
    getTagByIdParams: getTagByIdParamsSchema,
    createTag: createTagBodySchema,
    updateTag: updateTagBodySchema,
    updateTagParams: updateTagParamsSchema
};
