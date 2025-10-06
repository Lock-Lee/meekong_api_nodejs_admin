import { z } from "zod";

export const createBidSchema = z.object({
    auctionId: z.string().uuid("Invalid auction ID format"),
    userId: z.string().uuid("Invalid user ID format"),
    amount: z.number().positive("Bid amount must be positive"),
});

export const listBidsQuerySchema = z.object({
    auctionId: z.string().uuid("Invalid auction ID format"),
});

export const getBidByIdParamsSchema = z.object({
    id: z.string().uuid("Invalid auction ID format"),
});

export default {
    createBid: createBidSchema,
    listBidsQuery: listBidsQuerySchema,
    getBidByIdParams: getBidByIdParamsSchema,
};
