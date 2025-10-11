import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "../../../generated/prisma";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Social Providers Only (Google, Facebook, LINE)
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectURI: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/better/callback/google",
    },
    facebook: {
      clientId: process.env.FACEBOOK_APP_ID || "",
      clientSecret: process.env.FACEBOOK_APP_SECRET || "",
      redirectURI: process.env.FACEBOOK_CALLBACK_URL || "http://localhost:3000/api/auth/better/callback/facebook",
    },
    // LINE OAuth (Custom Provider)
    line: {
      clientId: process.env.LINE_CHANNEL_ID || "",
      clientSecret: process.env.LINE_CHANNEL_SECRET || "",
      redirectURI: process.env.LINE_CALLBACK_URL || "http://localhost:3000/api/auth/better/callback/line",
      authorizationUrl: "https://access.line.me/oauth2/v2.1/authorize",
      tokenUrl: "https://api.line.me/oauth2/v2.1/token",
      userInfoUrl: "https://api.line.me/v2/profile",
      scope: ["profile", "openid", "email"],
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24, // 24 hours
    updateAge: 60 * 60 * 24, // 24 hours
  },

  // Secret key
  secret: process.env.AUTH_SECRET || "default-secret-change-in-production",

  // Base URL
  baseURL: process.env.BASE_URL || "http://localhost:3000",

  // Trusted origins
  trustedOrigins: [
    process.env.BASE_URL || "http://localhost:3000",
    process.env.FRONTEND_URL || "http://localhost:3001",
  ],
});

export type Auth = typeof auth;
