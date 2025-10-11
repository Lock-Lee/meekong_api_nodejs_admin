import { z } from "zod";

const basicPhoneNumberSchema = z
  .string()
  .min(8, "Phone number must be at least 8 characters long")
  .max(15, "Phone number cannot exceed 15 characters")
  .regex(/^(0|\+66)[0-9]{8,13}$/, "Invalid phone number format");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter")
  .regex(/[a-z]/, "Password must include at least one lowercase letter")
  .regex(/[0-9]/, "Password must include at least one number")
  .regex(/[@$!%*?&]/, "Password must include at least one special character");

// const usernameSchema = z
//   .string()
//   .min(6, "Username must be at least 6 characters long")
//   .max(20, "Username must not exceed 20 characters")
//   .regex(
//     /^[a-zA-Z0-9_-]+$/,
//     "Username can only contain letters, numbers, hyphens, and underscores"
//   )
//   .refine((value) => !/^\d+$/.test(value), {
//     message: "Username cannot be only numbers",
//   })
//   .refine((value) => !/[@$!%*?&]/.test(value), {
//     message: "Username cannot contain special characters like @$!%*?&",
//   });

const login = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const loginByPhone = z.object({
  phone: z.string().min(1, "Phone number is required"),
  pin: z.string().min(4, "PIN must be 4 digits").max(4, "PIN must be 4 digits"),
  token: z.string().min(1, "Token is required"),
  firebaseToken: z.string().nullable().optional(),
  deviceInfo: z
    .object({
      id: z.string().min(1, "Device ID is required"),
      name: z.string().min(1, "Device name is required"),
      type: z.string().min(1, "Device type is required"),
    })
    .nullable()
    .optional(),
});



const register = z
  .object({
    email: z.string().email("Invalid email format"),
    password: passwordSchema,
    password_confirmation: z
      .string()
      .min(1, "Password confirmation is required"),
    phone: basicPhoneNumberSchema,
  })
  .refine((data) => data.password === data.password_confirmation, {
    path: ["password_confirmation"],
    message: "Passwords do not match",
  });

const socialAuth = z.object({
  accessToken: z.string().min(1, "Access token is required"),
  firebaseToken: z.string().nullable().optional(),
  deviceInfo: z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
      type: z.string().optional(),
    })
    .nullable()
    .optional(),
});

const forgotPassword = z.object({
  email: z.string().email("Invalid email format"),
});

const resetPassword = z.object({
  token: z.string().min(1, "Token is required"),
  pin: z.string().min(6, "PIN must be 6 digits").max(6, "PIN must be 6 digits"),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

const authSchema = {
  login,
  register,
  loginByPhone,
  socialAuth,
  forgotPassword,
  resetPassword,
};

export default authSchema;
