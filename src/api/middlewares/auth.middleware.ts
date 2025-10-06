import authConfig from "@shared/config/auth.config";
import Send from "@shared/utils/response.utils";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface DecodedToken {
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      id?: string;
    }
  }
}

class AuthMiddleware {
  /**
   * Middleware to authenticate the user based on the access token stored in the HttpOnly cookie.
   * This middleware will verify the access token and attach the user information to the request object.
   */
  static authenticateUser = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    // 1. Extract the access token from HttpOnly cookie OR Authorization header
    let token = req.cookies.accessToken;

    // If no cookie token, check Authorization header for Bearer token
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }

    // If there's no access token, return an error
    if (!token) {
      return Send.unauthorized(res, null); // Sends 401 Unauthorized if token is missing
    }

    try {
      // 2. Verify the token using the secret from the auth config
      const decodedToken = jwt.verify(token, authConfig.secret) as DecodedToken; // Type assertion for better type safety

      // If the token is valid, attach user information to the request object
      req.userId = decodedToken.userId; // Attach userId to the request object

      // Proceed to the next middleware or route handler
      next();
    } catch (error) {
      // If the token verification fails (invalid or expired token), return an error
      console.error("Authentication failed:", error); // Log error for debugging
      return Send.unauthorized(res, null); // Sends 401 Unauthorized if token is invalid or expired
    }
  };

  static refreshTokenValidation = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    // 1. Extract the refresh token from the HttpOnly cookie
    const refreshToken = req.cookies.refreshToken;

    // If there's no refresh token, return an error
    if (!refreshToken) {
      return Send.unauthorized(res, { message: "No refresh token provided" });
    }

    try {
      // 2. Verify the refresh token using the secret from the auth config
      const decodedToken = jwt.verify(
        refreshToken,
        authConfig.refresh_secret
      ) as { userId: string };

      // If the token is valid, attach user information to the request object
      req.userId = decodedToken.userId;

      // Proceed to the next middleware or route handler
      next();
    } catch (error) {
      // Handle token verification errors (invalid or expired token)
      console.error("Refresh Token authentication failed:", error);

      // Return a 401 Unauthorized with a more specific message
      return Send.unauthorized(res, {
        message: "Invalid or expired refresh token",
      });
    }
  };
}

export default AuthMiddleware;
