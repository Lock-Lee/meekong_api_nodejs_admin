import { z } from "zod";

export const getCategoryByIdParamsSchema = z.object({
    id: z.string().uuid("Invalid category ID format"),
});

export const getCategoryBySizeUnitIdParamsSchema = z.object({
    id: z.string().uuid("Invalid category ID format"),
    sizeUnitId: z.string().uuid("Invalid Size unit ID format"),
});

export const getCategoryParentIdParamsSchema = z.object({
    parentId: z.string().uuid("Invalid parent ID format"),
});

export const createCategoryBodySchema = z.object({
    nameTh: z.string().min(1, "Thai name is required"),
    nameEn: z.string().min(1, "English name is required"),
    imageUrl: z.string().url("Invalid image URL").optional(),
    parentId: z.string().uuid("Invalid parent ID format").optional(),
    level: z.number().int().min(1).max(4, "Category level must be between 1 and 4"),
});

export const updateCategoryBodySchema = z.object({
    nameTh: z.string().min(1, "Thai name is required"),
    nameEn: z.string().min(1, "English name is required"),
    imageUrl: z.string().url("Invalid image URL").optional(),
    parentId: z.string().uuid("Invalid parent ID format").optional(),
    level: z.number().int().min(1).max(4, "Category level must be between 1 and 4")
});

export const updateCategoryParamsSchema = z.object({
    id: z.string().uuid("Invalid Category ID format"),
});

export default {
    getCategoryByIdParams: getCategoryByIdParamsSchema,
    getCategoryBySizeUnitIdParams: getCategoryBySizeUnitIdParamsSchema,
    getCategoryParentIdParams: getCategoryParentIdParamsSchema,
    createCategory: createCategoryBodySchema,
    updateCategory: updateCategoryBodySchema,
    updateCategoryParams: updateCategoryParamsSchema
};
