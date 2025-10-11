import { Request, Response } from "express";
import Send from "../../shared/utils/response.utils";
import { inject, injectable } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { IAuthService } from "../../business/interfaces/auth.interfaces";
import authSchema from "../schemas/auth.schema";
import { z } from "zod";
import { BusinessError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";

@injectable()
export class AuthController {
  constructor(
    @inject(TYPES.AuthService) private readonly authService: IAuthService
  ) { }

  /**
   * User login endpoint
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const loginData = req.body as z.infer<typeof authSchema.login>;

      Logger.info("User login attempt", {
        email: loginData.email,
        requestId: req.id
      });

      const result = await this.authService.login(loginData);

      // Set tokens in HttpOnly cookies
      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 15 * 60 * 1000, // 15 minutes
        sameSite: "strict",
      });

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: "strict",
      });

      Logger.info("User logged in successfully", {
        userId: result.userId,
        requestId: req.id
      });

      return Send.success(res, {
        userId: result.userId,
        fullName: result.fullName,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error) {
      Logger.error("Login failed", {
        error: (error as Error).message,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Login failed");
    }
  };

  /**
   * User registration endpoint
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const registerData = req.body as z.infer<typeof authSchema.register>;

      Logger.info("User registration attempt", {
        email: registerData.email,
        requestId: req.id
      });

      const result = await this.authService.register(registerData);

      Logger.info("User registered successfully", {
        userId: result.id,
        requestId: req.id
      });

      return Send.success(res, result, "User successfully registered.");
    } catch (error) {
      Logger.error("Registration failed", {
        error: (error as Error).message,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Registration failed");
    }
  };

  /**
   * User logout endpoint
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken;

      Logger.info("User logout attempt", {
        userId: req.userId,
        requestId: req.id
      });

      await this.authService.logout(refreshToken);

      // Clear cookies
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      Logger.info("User logged out successfully", {
        userId: req.userId,
        requestId: req.id
      });

      return Send.success(res, null, "Logged out successfully.");
    } catch (error) {
      Logger.error("Logout failed", {
        error: (error as Error).message,
        userId: req.userId,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Logout failed");
    }
  };

  /**
   * Refresh token endpoint
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const refreshToken = req.cookies.refreshToken;

      Logger.info("Token refresh attempt", {
        userId,
        requestId: req.id
      });

      const result = await this.authService.refreshToken(userId, refreshToken);

      // Set new access token in cookie
      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 15 * 60 * 1000, // 15 minutes
        sameSite: "strict",
      });

      Logger.info("Token refreshed successfully", {
        userId,
        requestId: req.id
      });

      return Send.success(res, result);
    } catch (error) {
      Logger.error("Token refresh failed", {
        error: (error as Error).message,
        userId: req.userId,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Failed to refresh token");
    }
  };

  loginByPhone = async (req: Request, res: Response): Promise<void> => {
    try {
      const loginData = req.body as z.infer<typeof authSchema.loginByPhone>;

      Logger.info("User login attempt", {
        phone: loginData.phone,
        requestId: req.id
      });

      const result = await this.authService.loginByPhone(loginData);

      // Set tokens in HttpOnly cookies
      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 15 * 60 * 1000, // 15 minutes
        sameSite: "strict",
      });

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: "strict",
      });

      Logger.info("User logged in successfully", {
        userId: result.userId,
        requestId: req.id
      });

      return Send.success(res, {
        userId: result.userId,
        fullName: result.fullName,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error) {
      Logger.error("Login failed", {
        error: (error as Error).message,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Login failed");
    }
  };

  loginWithGoogle = async (req: Request, res: Response): Promise<void> => {
    try {
      const socialAuthData = req.body as z.infer<typeof authSchema.socialAuth>;

      Logger.info("Google login attempt", {
        requestId: req.id
      });

      const result = await this.authService.loginWithGoogle(socialAuthData);

      // Set tokens in HttpOnly cookies
      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 15 * 60 * 1000,
        sameSite: "strict",
      });

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "strict",
      });

      Logger.info("Google login successful", {
        userId: result.userId,
        isNewUser: result.isNewUser,
        requestId: req.id
      });

      return Send.success(res, result);
    } catch (error) {
      Logger.error("Google login failed", {
        error: (error as Error).message,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Google login failed");
    }
  };

  loginWithFacebook = async (req: Request, res: Response): Promise<void> => {
    try {
      const socialAuthData = req.body as z.infer<typeof authSchema.socialAuth>;

      Logger.info("Facebook login attempt", {
        requestId: req.id
      });

      const result = await this.authService.loginWithFacebook(socialAuthData);

      // Set tokens in HttpOnly cookies
      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 15 * 60 * 1000,
        sameSite: "strict",
      });

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "strict",
      });

      Logger.info("Facebook login successful", {
        userId: result.userId,
        isNewUser: result.isNewUser,
        requestId: req.id
      });

      return Send.success(res, result);
    } catch (error) {
      Logger.error("Facebook login failed", {
        error: (error as Error).message,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Facebook login failed");
    }
  };

  loginWithLine = async (req: Request, res: Response): Promise<void> => {
    try {
      const socialAuthData = req.body as z.infer<typeof authSchema.socialAuth>;

      Logger.info("LINE login attempt", {
        requestId: req.id
      });

      const result = await this.authService.loginWithLine(socialAuthData);

      // Set tokens in HttpOnly cookies
      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 15 * 60 * 1000,
        sameSite: "strict",
      });

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "strict",
      });

      Logger.info("LINE login successful", {
        userId: result.userId,
        isNewUser: result.isNewUser,
        requestId: req.id
      });

      return Send.success(res, result);
    } catch (error) {
      Logger.error("LINE login failed", {
        error: (error as Error).message,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "LINE login failed");
    }
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const forgotPasswordData = req.body as z.infer<typeof authSchema.forgotPassword>;

      Logger.info("Forgot password request", {
        email: forgotPasswordData.email,
        requestId: req.id
      });

      const result = await this.authService.forgotPassword(forgotPasswordData);

      Logger.info("Forgot password request processed", {
        requestId: req.id
      });

      return Send.success(res, result);
    } catch (error) {
      Logger.error("Forgot password failed", {
        error: (error as Error).message,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Forgot password failed");
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const resetPasswordData = req.body as z.infer<typeof authSchema.resetPassword>;

      Logger.info("Reset password attempt", {
        requestId: req.id
      });

      const result = await this.authService.resetPassword(resetPasswordData);

      Logger.info("Password reset successful", {
        requestId: req.id
      });

      return Send.success(res, result);
    } catch (error) {
      Logger.error("Reset password failed", {
        error: (error as Error).message,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Reset password failed");
    }
  };
}

// Remove default export to avoid confusion with named export
// Container binds the named export
// export default AuthController;
