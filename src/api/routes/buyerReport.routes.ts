import BaseRouter, { RouteConfig } from "./router";
import { BuyerReportController } from "@controllers/buyerReport.controller";
import AuthMiddleware from "../middlewares/auth.middleware";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";

class BuyerReportRouter extends BaseRouter {
    private readonly buyerReportController: BuyerReportController;

    constructor() {
        super();
        this.buyerReportController = container.get<BuyerReportController>(TYPES.BuyerReportController);
    }
    protected routes(): RouteConfig[] {
        return [
            {
                /**
                 * @swagger
                 * /api/buyer-report:
                 *   get:
                 *     tags: [BuyerReport]
                 *     summary: Get buyer reports
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - name: itemId?
                 *         in: query
                 *         required: false
                 *         schema:
                 *           type: string
                 *       - name: typeId?
                 *         in: query
                 *         required: false
                 *         schema:
                 *           type: string
                 *       - name: shopId?
                 *         in: query
                 *         required: false
                 *         schema:
                 *           type: string
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 *       401:
                 *         description: Unauthorized
                 */
                method: 'get',
                path: '/',
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.buyerReportController.getBuyerReport.bind(this.buyerReportController),
            },
            {
                /**
                * @swagger
                * /api/buyer-report:
                *   post:
                *     tags: [BuyerReport]
                *     summary: Create buyer report
                *     security:
                *       - bearerAuth: []
                *     requestBody:
                *       required: true
                *       content:
                *         multipart/form-data:
                *           schema:
                *             type: object
                *             properties:
                *               buyerId:
                *                 type: string
                *                 format: uuid
                *                 description: User UUID
                *               itemId:
                *                 type: string
                *                 format: uuid
                *                 description: Item UUID
                *               typeId:
                *                 type: string
                *                 format: uuid
                *                 description: Type UUID
                *               shopId:
                *                 type: string
                *                 format: uuid
                *                 description: Shop UUID
                *               reason:
                *                 type: string
                *                 description: Reason
                *               images:
                *                 type: array
                *                 items:
                *                   type: string
                *                   format: binary
                *                 description: Images
         
                *     responses:
                *       200:
                *         description: Successful operation
                *       401:
                *         description: Unauthorized
                */
                method: 'post',
                path: '/',
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.buyerReportController.createBuyerReport.bind(this.buyerReportController),
            },
        ];
    }
}

export default new BuyerReportRouter().router;