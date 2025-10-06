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
    sex: z.nativeEnum(Gender).optional(),
    birthdate: z.string().datetime("Invalid datetime format").optional(),
});

export default {
    getProfileByIdParams: getProfileByIdParamsSchema,
    updateProfile: updateProfileBodySchema,
};
