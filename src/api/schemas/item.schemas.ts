import { z } from "zod";
import { ItemType, SellType , Status } from "../../../generated/prisma";

// Validation schema for list items query
export const listItemsQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  sellType: z
    .union([z.nativeEnum(SellType), z.array(z.nativeEnum(SellType))])
    .optional()
    .transform((val: unknown) => {
      if (val === undefined) return undefined;
      if (Array.isArray(val)) return val;
      return [val];
    }),
  page: z.string().optional().default("1").transform(Number),
});

// Zod schema for creating an item
export const createItemBodySchema = z.object({
  brandId: z.string().uuid({ message: "Invalid brandId format." }),
  categoryId: z.string().uuid({ message: "Invalid categoryId format." }),
  // Item names in Thai and English
  nameTh: z.string().optional(),
  nameEn: z.string().optional(),
  descriptionTh: z.string(),
  descriptionEn: z.string(),
  status: z.nativeEnum(Status).optional(),
  // Tags as JSON string array. Optional field.
  // Example: formData.append('tags', '["electronics", "smartphone", "gadget"]');
  tags: z
    .string()
    .transform((str: string, ctx: z.RefinementCtx) => {
      try {
        const parsed = JSON.parse(str);

        // Ensure it's an array
        const tagArray = Array.isArray(parsed) ? parsed : [parsed];

        // Validate array length (maximum 3 tags)
        if (tagArray.length > 3) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Maximum 3 tags allowed.",
          });
          return z.NEVER;
        }

        // Clean and filter tags
        const cleanTags = tagArray
          .map((tag) => String(tag).trim())
          .filter((tag) => tag.length > 0);

        return cleanTags;
      } catch {
        ctx.addIssue({
          code: "custom",
          message: "Invalid JSON format for tags. Expected JSON array string.",
        });
        return z.NEVER;
      }
    })
    .optional(),
  // Transform string to number for multipart/form-data compatibility
  shippingDuration: z
    .union([
      z.string().transform((str: string, ctx: z.RefinementCtx) => {
        const num = parseInt(str, 10);
        if (isNaN(num)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Shipping duration must be a valid number.",
          });
          return z.NEVER;
        }
        return num;
      }),
      z.number(),
    ])
    .pipe(
      z
        .number()
        .int()
        .min(1)
        .max(30, { message: "Shipping duration must be between 1-30 days." })
    )
    .optional(),
  itemType: z.nativeEnum(ItemType),
  sellType: z.nativeEnum(SellType),
  // itemVariants optional; if provided, attempt to parse JSON, otherwise ignore without validation
  itemVariants: z
    .string()
    .optional()
    .transform((str: string | undefined) => {
      if (str === undefined) return undefined;
      try {
        return JSON.parse(str);
      } catch {
        // If parsing fails, ignore to comply with "no validation" requirement
        return undefined;
      }
    }),
});

// Schema for search items
export const searchItemsQuerySchema = z.object({
  keyword: z.string().optional(),
  categoryId: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val: unknown) => {
      if (val === undefined) return undefined;
      if (Array.isArray(val)) return val;
      return [val];
    }),
  brandId: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val: unknown) => {
      if (val === undefined) return undefined;
      if (Array.isArray(val)) return val;
      return [val];
    }),
  minPrice: z
    .string()
    .optional()
    .transform((val: string | undefined) =>
      val ? parseFloat(val) : undefined
    ),
  maxPrice: z
    .string()
    .optional()
    .transform((val: string | undefined) =>
      val ? parseFloat(val) : undefined
    ),
  itemType: z.nativeEnum(ItemType).optional(),
  sellType: z
    .union([z.nativeEnum(SellType), z.array(z.nativeEnum(SellType))])
    .optional()
    .transform((val: unknown) => {
      if (val === undefined) return undefined;
      if (Array.isArray(val)) return val;
      return [val];
    }),
  page: z.string().optional().default("1").transform(Number),
});

// Schema for search suggestions
export const searchSuggestionsQuerySchema = z.object({
  query: z.string().min(2, { message: "Query must be at least 2 characters." }),
  limit: z.string().optional().default("5").transform(Number),
});

// Zod schema for updating an item
export const updateItemBodySchema = z.object({
  brandId: z.string().uuid({ message: "Invalid brandId format." }).optional(),
  categoryId: z
    .string()
    .uuid({ message: "Invalid categoryId format." })
    .optional(),
  nameTh: z.string().optional(),
  nameEn: z.string().optional(),
  descriptionTh: z.string().optional(),
  descriptionEn: z.string().optional(),
  // Tags as JSON string array. Optional field.
  // Example: formData.append('tags', '["electronics", "smartphone", "gadget"]');
  tags: z
    .string()
    .transform((str: string, ctx: z.RefinementCtx) => {
      try {
        const parsed = JSON.parse(str);

        // Ensure it's an array
        const tagArray = Array.isArray(parsed) ? parsed : [parsed];

        // Validate array length (maximum 3 tags)
        if (tagArray.length > 3) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Maximum 3 tags allowed.",
          });
          return z.NEVER;
        }

        // Clean and filter tags
        const cleanTags = tagArray
          .map((tag) => String(tag).trim())
          .filter((tag) => tag.length > 0);

        return cleanTags;
      } catch {
        ctx.addIssue({
          code: "custom",
          message: "Invalid JSON format for tags. Expected JSON array string.",
        });
        return z.NEVER;
      }
    })
    .optional(),
  // Transform string to number for multipart/form-data compatibility
  shippingDuration: z
    .union([
      z.string().transform((str: string, ctx: z.RefinementCtx) => {
        const num = parseInt(str, 10);
        if (isNaN(num)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Shipping duration must be a valid number.",
          });
          return z.NEVER;
        }
        return num;
      }),
      z.number(),
    ])
    .pipe(
      z
        .number()
        .int()
        .min(1)
        .max(30, { message: "Shipping duration must be between 1-30 days." })
    )
    .optional(),
  itemType: z.nativeEnum(ItemType).optional(),
  sellType: z.nativeEnum(SellType).optional(),
  itemVariants: z
  .string()
  .optional()
  .transform((str: string | undefined) => {
    if (str === undefined) return undefined;
    try {
      return JSON.parse(str);
    } catch {
      // If parsing fails, ignore to comply with "no validation" requirement
      return undefined;
    }
  }),
});

// Schema for updating item variant (price and stock)
export const updateItemVariantBodySchema = z.object({
  nameTh: z.string().optional(),
  nameEn: z.string().optional(),
  itemVariants :z.array(z.object({
    variantId: z.string(),
    price:  z.number().optional(),
    stockQuantity: z.number().optional()  
  }))
});

// Schema for updating auction item
export const updateVariantAuctionItemBodySchema = z.object({
  nameTh: z.string().optional(),
  nameEn: z.string().optional(),
  itemVariants: z
    .array(
      z.object({
        variantId: z.string(),
        stockQuantity: z
          .union([
            z.string().transform((str: string, ctx: z.RefinementCtx) => {
              const num = parseInt(str, 10);
              if (isNaN(num)) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Quantity must be a valid number.",
                });
                return z.NEVER;
              }
              return num;
            }),
            z.number(),
          ])
          .pipe(z.number().int().min(0, { message: "Quantity must be 0 or more." }))
          .optional(),
      })
    )
    .optional(),
  itemAuction: z
    .array(
      z.object({
        auctionId: z.string(),
        startPrice: z
          .union([
            z.string().transform((str: string, ctx: z.RefinementCtx) => {
              const num = parseFloat(str);
              if (isNaN(num)) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Start price must be a valid number.",
                });
                return z.NEVER;
              }
              return num;
            }),
            z.number(),
          ])
          .pipe(z.number().positive({ message: "Start price must be greater than 0." }))
          .optional(),
        buyNowPrice: z
          .union([
            z.string().transform((str: string, ctx: z.RefinementCtx) => {
              const num = parseFloat(str);
              if (isNaN(num)) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Buy now price must be a valid number.",
                });
                return z.NEVER;
              }
              return num;
            }),
            z.number(),
          ])
          .pipe(z.number().positive({ message: "Buy now price must be greater than 0." }))
          .optional(),
        startAt: z.string().datetime({ message: "Start date must be a valid ISO datetime." }).optional(),
        endAt: z.string().datetime({ message: "End date must be a valid ISO datetime." }).optional(),
      })
    )
    .optional(),
});
