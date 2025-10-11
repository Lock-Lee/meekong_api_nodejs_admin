import BaseRouter, { RouteConfig } from "./router";
import { OTPController } from "@controllers/opt.controller";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";

class OTPRouter extends BaseRouter {
    private readonly buyerReviewController: OTPController;

    constructor() {
        super();
        this.buyerReviewController = container.get<OTPController>(TYPES.OTPController);
    }

    protected routes(): RouteConfig[] {
        return [
            {
                /**
                 * @swagger
                 * /api/otp/otp-sms/request:
                 *   post:
                 *     tags: [OTP]
                 *     summary: Request OTP SMS
                 *     security:
                 *       - bearerAuth: []
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         application/json:
                 *           schema:
                 *             type: object
                 *             properties:
                 *               userId:
                 *                 type: string
                 *                 description: User ID
                 *               msisdn:
                 *                 type: string
                 *                 description: MSISDN
                 *             required:
                 *               - msisdn
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 */
                method: "post",
                path: "/otp-sms/request",
                // middlewares: [AuthMiddleware.authenticateUser],
                handler: this.buyerReviewController.requestOTPSMS.bind(this.buyerReviewController),
            },
            {
                /**
                 * @swagger
                 * /api/otp/otp-sms/verify:
                 *   post:
                 *     tags: [OTP]
                 *     summary: Verify OTP SMS
                 *     security:
                 *       - bearerAuth: []
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         application/json:
                 *           schema:
                 *             type: object
                 *             properties:
                 *               token:
                 *                 type: string
                 *                 description: OTP token
                 *               pin:
                 *                 type: string
                 *                 description: OTP pin
                 *             required:
                 *               - token
                 *               - pin
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 */
                method: "post",
                path: "/otp-sms/verify",
                // middlewares: [AuthMiddleware.authenticateUser],
                handler: this.buyerReviewController.verifyOTPSMS.bind(this.buyerReviewController),
            },
            {
                /**
                 * @swagger
                 * /api/otp/otp-mail/request:
                 *   post:
                 *     tags: [OTP]
                 *     summary: Request OTP Email
                 *     security:
                 *       - bearerAuth: []
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         application/json:
                 *           schema:
                 *             type: object
                 *             properties:
                 *               userId:
                 *                 type: string
                 *                 description: User ID
                 *               email:
                 *                 type: string
                 *                 description: Email address
                 *             required:
                 *               - userId
                 *               - email
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 */
                method: "post",
                path: "/otp-mail/request",
                // middlewares: [AuthMiddleware.authenticateUser],
                handler: this.buyerReviewController.requestOTPEmail.bind(this.buyerReviewController),
            },
            {
                /**
                 * @swagger
                 * /api/otp/otp-mail/verify:
                 *   post:
                 *     tags: [OTP]
                 *     summary: Verify OTP Email
                 *     security:
                 *       - bearerAuth: []
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         application/json:
                 *           schema:
                 *             type: object
                 *             properties:
                 *               token:
                 *                 type: string
                 *                 description: OTP token
                 *               pin:
                 *                 type: string
                 *                 description: OTP pin
                 *             required:
                 *               - token
                 *               - pin
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 */
                method: "post",
                path: "/otp-mail/verify",
                // middlewares: [AuthMiddleware.authenticateUser],
                handler: this.buyerReviewController.verifyOTPEmail.bind(this.buyerReviewController),
            },

        ];
    }
}
export default new OTPRouter().router;