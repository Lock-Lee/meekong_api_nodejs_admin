import { z } from "zod";

export const listBrandsQuerySchema = z.object({
    page: z.string().optional().default("1").transform(Number),
});

export const createBrandBodySchema = z.object({
    nameTh: z.string().min(1, "Thai name is required"),
    nameEn: z.string().min(1, "English name is required"),
    createdById: z.string().uuid("Invalid createdById format"),
});

export default {
    listBrandsQuery: listBrandsQuerySchema,
    createBrand: createBrandBodySchema,
};
