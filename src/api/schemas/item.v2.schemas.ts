import { z } from "zod";
import { ItemType, SellType, ProductCondition } from "../../../generated/prisma";

export const createItemV2BodySchema = z.object({
    brandId: z.string().uuid({ message: "Invalid brandId format." }),
    categoryId: z.string().uuid({ message: "Invalid categoryId format." }),
    nameTh: z.string().min(1, { message: "Thai name is required." }),
    nameEn: z.string().min(1, { message: "English name is required." }),
    descriptionTh: z.string(),
    descriptionEn: z.string(),
    // Tags as direct array (since V2 is JSON-only, no need for string transformation)
    tags: z.array(z.string().trim().min(1)).max(3, { message: "Maximum 3 tags allowed." }).optional(),
    // Direct number validation (since V2 is JSON-only, no need for string transformation)
    shippingDuration: z.number().int().min(1).max(30, { message: "Shipping duration must be between 1-30 days." }).optional(),
    itemType: z.nativeEnum(ItemType),
    sellType: z.nativeEnum(SellType),
    // Direct object array validation (since V2 is JSON-only, no need for string transformation)
    itemVariants: z.array(
        z.object({
            variantName: z.string().min(1, { message: "Variant name is required." }),
            price: z.number().positive({ message: "Price must be a positive number." }),
            comparePrice: z.number().positive().optional(),
            sku: z.string().optional(),
            color: z.string().optional(),
            conditionDescription: z.nativeEnum(ProductCondition).optional(),
            defectNotes: z.string().optional(),
            includedItems: z.string().optional(),
            stockQuantity: z.number().int().min(0).default(0),
            sizes: z
                .array(
                    z.object({
                        sizeUnitId: z.string().uuid(),
                        value: z.string(),
                        sortOrder: z.number().int().optional(),
                    })
                )
                .optional(),
        })
    ).min(1, { message: "At least one item variant is required." }),
});

export const updateItemV2BodySchema = createItemV2BodySchema.partial().refine((data) => {
    // Ensure at least one field is provided for update
    return Object.keys(data).length > 0;
}, {
    message: "At least one field must be provided for update.",
});


