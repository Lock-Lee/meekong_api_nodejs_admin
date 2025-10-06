import BaseRouter, { RouteConfig } from "./router";
import { BuyerOrderController } from "@controllers/buyerOrder.controller";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import AuthMiddleware from "../middlewares/auth.middleware";


class BuyerOrderRouter extends BaseRouter {
    private readonly buyerOrderController: BuyerOrderController;
    constructor() {
        super();
        this.buyerOrderController = container.get<BuyerOrderController>(TYPES.BuyerOrderController);
    }
    protected routes(): RouteConfig[] {
        return [
            {
                /**
                 * @swagger
                 * /api/buyer-order:
                 *   get:
                 *     tags: [Buyer Order]
                 *     summary: Get all buyer orders
                 *     security:
                 *       - bearerAuth: []
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 */
                method: "get",
                path: "/",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.buyerOrderController.getAll.bind(this.buyerOrderController),
            },
            {
                /**
                 * @swagger
                 * /api/buyer-order/{status}:
                 *   get:
                 *     tags: [Buyer Order]
                 *     summary: Get buyer orders by status
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: status 
                 *         required: true
                 *         schema:
                 *           type: string
                 *           enum: [PENDING, PAID, SHIPPED, COMPLETED, CANCELLED, DISPUTED]
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 */
                method: "get",
                path: "/:status",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.buyerOrderController.getByStatus.bind(this.buyerOrderController),
            },
        ];
        
    }

}


export default new BuyerOrderRouter().router;
