import { Router } from "express";
import { auth } from "../../shared/config/better-auth.config";

const betterAuthRouter = Router();

// Better Auth handles all routes automatically
// Mount all Better Auth routes at /api/auth/better
betterAuthRouter.all("*", async (req, res) => {
  return auth.handler(req, res);
});

export default betterAuthRouter;
