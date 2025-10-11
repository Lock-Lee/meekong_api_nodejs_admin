import { z } from "zod";

export const createBidSchema = z.object({
    auctionId: z.string().uuid("Invalid auction ID format"),
    userId: z.string().uuid("Invalid user ID format"),
    amount: z.number().positive("Bid amount must be positive"),
    cardToken: z.string().optional(), // Optional card token for payment
});

export const listBidsQuerySchema = z.object({
    auctionId: z.string().uuid("Invalid auction ID format"),
});

export const getBidByIdParamsSchema = z.object({
    id: z.string().uuid("Invalid auction ID format"),
});

export const cancelBidParamsSchema = z.object({
    id: z.string().uuid("Invalid bid ID format"),
});

export default {
    createBid: createBidSchema,
    listBidsQuery: listBidsQuerySchema,
    getBidByIdParams: getBidByIdParamsSchema,
    cancelBidParams: cancelBidParamsSchema,
};
