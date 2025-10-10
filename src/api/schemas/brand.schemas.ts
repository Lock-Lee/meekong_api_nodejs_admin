import { z } from "zod";

export const listBrandsQuerySchema = z.object({
    page: z.string().optional().default("1").transform(Number),
});

export const createBrandBodySchema = z.object({
    nameTh: z.string().min(1, "Thai name is required"),
    nameEn: z.string().min(1, "English name is required"),
    createdById: z.string().uuid("Invalid createdById format"),
});
export const bulkUpsertSchema = z.object({
    items: z.array(
        z.object({
            id: z.string().min(1).optional(),
            nameTh: z.string().min(1),
            nameEn: z.string().min(1),
            actorId: z.string().min(1),
        })
    ).min(1),
})
export const updateBrandSchema = z.object({
    nameTh: z.string().min(1, "Thai name is required"),
    nameEn: z.string().min(1, "English name is required"),
    updatedById: z.string().uuid("Invalid updatedById format"),
});

export default {
    listBrandsQuery: listBrandsQuerySchema,
    createBrand: createBrandBodySchema,
    updateBrand: updateBrandSchema,
    bulkUpsert: bulkUpsertSchema
};
