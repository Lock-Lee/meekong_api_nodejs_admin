import BaseRouter, { RouteConfig } from "./router";


import { BuyerCheckoutController } from "@controllers/buyerCheckout.controller";
import AuthMiddleware from "../middlewares/auth.middleware";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";

class BuyerCheckoutRouter extends BaseRouter {
    private readonly buyerCheckoutController: BuyerCheckoutController;

    constructor() {
        super();
        this.buyerCheckoutController = container.get<BuyerCheckoutController>(TYPES.BuyerCheckoutController);
    }

    protected routes(): RouteConfig[] {
        return [
            {
                /**
                 * @swagger
                 * /api/buyer-checkout/:
                 *   post:
                 *     tags: [Buyer Checkout]
                 *     summary: Checkout and create order
                 *     security:
                 *       - bearerAuth: []
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         application/json:
                 *           schema:
                 *             type: object
                 *             properties:
                 *               buyerId:
                 *                 type: string
                 *                 description: ID of the buyer
                 *               shopId:
                 *                 type: string
                 *                 description: ID of the shop
                 *               items:
                 *                 type: array
                 *                 items:
                 *                   type: object
                 *                   properties:
                 *                     productId:
                 *                       type: string
                 *                       description: ID of the product
                 *                     quantity:
                 *                       type: integer
                 *                       description: Quantity of the product
                 *               addressId:
                 *                 type: string
                 *                 description: ID of the address
                 *               paymentMethod:
                 *                 type: string
                 *                 description: Payment method (e.g., 'CREDIT_CARD', 'PROMPTPAY')
                 *               totalAmount:
                 *                 type: number
                 *                 description: Total amount for the order
                 *     responses:
                 *       201:
                 *         description: Order created successfully
                 *         content:
                 *           application/json:
                 *             schema:
                 *               $ref: '#/components/schemas/CheckoutResult'
                 *       400:
                 *         description: Invalid input data
                 *       401:
                 *         description: Unauthorized
                 */
                method: "post",
                path: "/",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.buyerCheckoutController.checkout.bind(this.buyerCheckoutController),
            },
            {
                /**
                 * @swagger
                 * /api/buyer-checkout/{orderId}/paid:
                 *   patch:
                 *     tags: [Buyer Checkout]
                 *     summary: Update order status to PAID
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: orderId
                 *         required: true
                 *         schema:
                 *           type: string
                 *         description: ID of the order to update
                 *     responses:
                 *       200:
                 *         description: Order status updated successfully
                 *         content:
                 *           application/json:
                 *             schema:
                 *               type: object
                 *               properties:
                 *                 orderId:
                 *                   type: string
                 *                   description: ID of the updated order
                 *                 status:
                 *                   type: string
                 *                   description: New status of the order
                 *                 updatedAt:
                 *                   type: string
                 *                   format: date-time
                 *                   description: Timestamp of the update
                 *       400:
                 *         description: Invalid order ID
                 *       401:
                 *         description: Unauthorized
                 *       404:
                 *         description: Order not found
                 */
                method: "patch",
                path: "/:orderId/paid",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.buyerCheckoutController.updateOrderStatusToPaid.bind(this.buyerCheckoutController),
            },
        ];
    }
}
export default new BuyerCheckoutRouter().router;