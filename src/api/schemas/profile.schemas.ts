import { z } from "zod";
import { Gender } from "../../../generated/prisma";

export const getProfileByIdParamsSchema = z.object({
    id: z.string().uuid("Invalid user ID format"),
});

export const updateProfileBodySchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email("Invalid email format").optional(),
    phone: z.string().min(1).optional(),
    gender: z.nativeEnum(Gender).optional(),
    birthDate: z.string().optional(),
});

export default {
    getProfileByIdParams: getProfileByIdParamsSchema,
    updateProfile: updateProfileBodySchema,
};
