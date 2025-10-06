import { z } from "zod";
import { AuctionParticipantStatus } from "../../../generated/prisma";

export const listParticipantsQuerySchema = z.object({
    auctionId: z.string().uuid("Invalid auction ID format"),
});

export const createParticipantBodySchema = z.object({
    auctionId: z.string().uuid("Invalid auction ID format"),
    userId: z.string().uuid("Invalid user ID format"),
    depositAmount: z.number().positive("Deposit amount must be positive"),
});

export const updateParticipantParamsSchema = z.object({
    id: z.string().uuid("Invalid participant ID format"),
});

export const updateParticipantBodySchema = z.object({
    status: z.nativeEnum(AuctionParticipantStatus),
});

export default {
    listParticipantsQuery: listParticipantsQuerySchema,
    createParticipant: createParticipantBodySchema,
    updateParticipantParams: updateParticipantParamsSchema,
    updateParticipant: updateParticipantBodySchema,
};
