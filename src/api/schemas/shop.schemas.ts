import { z } from "zod";

export const upsertShopSchema = z.object({
    name: z.string().min(1, "Shop name is required"),
    description: z.string().optional(),
});

export const getShopBySellerIdSchema = z.object({
    sellerId: z.string().uuid("Invalid seller ID format"),
});

export default {
    upsertShop: upsertShopSchema,
    getShopBySellerId: getShopBySellerIdSchema,
};
