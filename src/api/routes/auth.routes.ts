import { AuthController } from "../controllers/auth.controller";
import BaseRouter, { RouteConfig } from "./router";
import ValidationMiddleware from "../middlewares/validation.middleware";
import authSchema from "../schemas/auth.schema";
import AuthMiddleware from "../middlewares/auth.middleware";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";

class AuthRouter extends BaseRouter {
  private readonly authController: AuthController;

  constructor() {
    super();
    this.authController = container.get<AuthController>(TYPES.AuthController);
  }

  protected routes(): RouteConfig[] {
    return [
      {
        /**
         * @swagger
         * /api/auth/login:
         *   post:
         *     tags: [Auth]
         *     summary: User login
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               email:
         *                 type: string
         *               password:
         *                 type: string
         *     responses:
         *       200:
         *         description: Successful login
         *       401:
         *         description: Invalid credentials
         */
        method: "post",
        path: "/login",
        // @ts-ignore
        // Object literal may only specify known properties, and 'middlewares' does not exist in type 'RouteConfig'.
        middlewares: [ValidationMiddleware.validateBody(authSchema.login)],
        handler: this.authController.login.bind(this.authController),
      },
      {
        /**
         * @swagger
         * /api/auth/login-by-phone:
         *   post:
         *     tags: [Auth]
         *     summary: User login by phone
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               phone:
         *                 type: string
         *                 description: Phone number
         *               pin:
         *                 type: string
         *                 description: 6-digit PIN
         *               token:
         *                 type: string
         *                 description: Authentication token
         *               firebaseToken:
         *                 type: string
         *                 description: Firebase token (optional)
         *               deviceInfo:
         *                 type: object
         *                 description: Device information (optional)
         *                 properties:
         *                   id:
         *                     type: string
         *                     description: Device ID
         *                   name:
         *                     type: string
         *                     description: Device name
         *                   type:
         *                     type: string
         *                     description: Device type
         *     responses:
         *       200:
         *         description: Successful login
         *       401:
         *         description: Invalid credentials
         */
        method: "post",
        path: "/login-by-phone",
        // @ts-ignore
        // Object literal may only specify known properties, and 'middlewares' does not exist in type 'RouteConfig'.
        middlewares: [ValidationMiddleware.validateBody(authSchema.login)],
        handler: this.authController.loginByPhone.bind(this.authController),
      },
      {
        /**
         * @swagger
         * /api/auth/register:
         *   post:
         *     tags: [Auth]
         *     summary: User registration
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               email:
         *                 type: string
         *               password:
         *                 type: string
         *               name:
         *                 type: string
         *     responses:
         *       201:
         *         description: User created successfully
         *       400:
         *         description: Invalid input
         */
        method: "post",
        path: "/register",
        // @ts-ignore
        middlewares: [ValidationMiddleware.validateBody(authSchema.register)],
        handler: this.authController.register.bind(this.authController),
      },
      {
        /**
         * @swagger
         * /api/auth/logout:
         *   post:
         *     tags: [Auth]
         *     summary: User logout
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: Successful logout
         *       401:
         *         description: Unauthorized
         */
        method: "post",
        path: "/logout",
        // @ts-ignore
        middlewares: [
          // check if user is logged in
          AuthMiddleware.authenticateUser,
        ],
        handler: this.authController.logout.bind(this.authController),
      },

      {
        /**
         * @swagger
         * /api/auth/refresh-token:
         *   post:
         *     tags: [Auth]
         *     summary: Refresh access token
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               refreshToken:
         *                 type: string
         *     responses:
         *       200:
         *         description: Token refreshed successfully
         *       401:
         *         description: Invalid refresh token
         */
        method: "post",
        path: "/refresh-token",
        // @ts-ignore
        middlewares: [
          // checks if refresh token is valid
          AuthMiddleware.refreshTokenValidation,
        ],
        handler: this.authController.refreshToken.bind(this.authController),
      },
      {
        /**
         * @swagger
         * /api/auth/google:
         *   post:
         *     tags: [Auth]
         *     summary: Login with Google
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               accessToken:
         *                 type: string
         *               firebaseToken:
         *                 type: string
         *               deviceInfo:
         *                 type: object
         *     responses:
         *       200:
         *         description: Successful login
         */
        method: "post",
        path: "/google",
        // @ts-ignore
        middlewares: [ValidationMiddleware.validateBody(authSchema.socialAuth)],
        handler: this.authController.loginWithGoogle.bind(this.authController),
      },
      {
        /**
         * @swagger
         * /api/auth/facebook:
         *   post:
         *     tags: [Auth]
         *     summary: Login with Facebook
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               accessToken:
         *                 type: string
         *               firebaseToken:
         *                 type: string
         *               deviceInfo:
         *                 type: object
         *     responses:
         *       200:
         *         description: Successful login
         */
        method: "post",
        path: "/facebook",
        // @ts-ignore
        middlewares: [ValidationMiddleware.validateBody(authSchema.socialAuth)],
        handler: this.authController.loginWithFacebook.bind(this.authController),
      },
      {
        /**
         * @swagger
         * /api/auth/line:
         *   post:
         *     tags: [Auth]
         *     summary: Login with LINE
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               accessToken:
         *                 type: string
         *               firebaseToken:
         *                 type: string
         *               deviceInfo:
         *                 type: object
         *     responses:
         *       200:
         *         description: Successful login
         */
        method: "post",
        path: "/line",
        // @ts-ignore
        middlewares: [ValidationMiddleware.validateBody(authSchema.socialAuth)],
        handler: this.authController.loginWithLine.bind(this.authController),
      },
      {
        /**
         * @swagger
         * /api/auth/forget:
         *   post:
         *     tags: [Auth]
         *     summary: Forgot password
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               email:
         *                 type: string
         *     responses:
         *       200:
         *         description: Password reset email sent
         */
        method: "post",
        path: "/forget",
        // @ts-ignore
        middlewares: [ValidationMiddleware.validateBody(authSchema.forgotPassword)],
        handler: this.authController.forgotPassword.bind(this.authController),
      },
      {
        /**
         * @swagger
         * /api/auth/reset-password:
         *   post:
         *     tags: [Auth]
         *     summary: Reset password
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               token:
         *                 type: string
         *               newPassword:
         *                 type: string
         *               confirmPassword:
         *                 type: string
         *     responses:
         *       200:
         *         description: Password reset successfully
         */
        method: "post",
        path: "/reset-password",
        // @ts-ignore
        middlewares: [ValidationMiddleware.validateBody(authSchema.resetPassword)],
        handler: this.authController.resetPassword.bind(this.authController),
      },
    ];
  }
}

export default new AuthRouter().router;
