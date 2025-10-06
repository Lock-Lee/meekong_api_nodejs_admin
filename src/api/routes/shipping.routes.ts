import BaseRouter, { RouteConfig } from "./router";
import { ShippingController } from "@controllers/shipping.controller";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import AuthMiddleware from "@api/middlewares/auth.middleware";

class ShippingRouter extends BaseRouter {
    private readonly shippingController: ShippingController;

    constructor() {
        super();
        this.shippingController = container.get<ShippingController>(TYPES.ShippingController);
    }

    protected routes(): RouteConfig[] {
        return [
            {
                /**
                 * @swagger
                 * /api/shipping/courier/information/{language}:
                 *   get:
                 *     tags: [Shipping]
                 *     summary: Get courier information
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: language
                 *         required: true
                 *         schema:
                 *           type: string
                 *         description: Language code (e.g., en, th)
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 *         content:
                 *           application/json:
                 *             schema:
                 *               type: object
                 *       400:
                 *         description: Bad request - missing language parameter
                 *       500:
                 *         description: Internal server error
                 */
                method: "get",
                path: "/courier/information/:language",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.shippingController.getCourierInformation.bind(this.shippingController),
            },
            {
                /**
                 * @swagger
                 * /api/shipping/price/check/multiple:
                 *   post:
                 *     tags: [Shipping]
                 *     summary: Check shipping prices for multiple items
                 *     description: Check shipping prices for multiple items in a single request
                 *     security:
                 *       - bearerAuth: []
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         application/json:
                 *           schema:
                 *             type: array
                 *             items:
                 *               type: object
                 *               properties:
                 *                 from:
                 *                   type: object
                 *                   properties:
                 *                     district_name:
                 *                       type: string
                 *                       example: "บางรัก"
                 *                     state_name:
                 *                       type: string
                 *                       example: "กรุงเทพมหานคร"
                 *                     postcode:
                 *                       type: string
                 *                       example: "10500"
                 *                 to:
                 *                   type: object
                 *                   properties:
                 *                     district_name:
                 *                       type: string
                 *                       example: "บางซื่อ"
                 *                     state_name:
                 *                       type: string
                 *                       example: "กรุงเทพมหานคร"
                 *                     postcode:
                 *                       type: string
                 *                       example: "10800"
                 *                 parcel:
                 *                   type: object
                 *                   properties:
                 *                     name:
                 *                       type: string
                 *                       example: "Test Product"
                 *                     weight:
                 *                       type: number
                 *                       example: 1
                 *                     width:
                 *                       type: number
                 *                       example: 10
                 *                     length:
                 *                       type: number
                 *                       example: 10
                 *                     height:
                 *                       type: number
                 *                       example: 10
                 *                 courier_code:
                 *                   type: string
                 *                   example: "kerry"
                 *               required:
                 *                 - from
                 *                 - to
                 *                 - parcel
                 *                 - courier_code
                 *           example:
                 *             - from:
                 *                 district_name: "บางรัก"
                 *                 state_name: "กรุงเทพมหานคร"
                 *                 postcode: "10500"
                 *               to:
                 *                 district_name: "บางซื่อ"
                 *                 state_name: "กรุงเทพมหานคร"
                 *                 postcode: "10800"
                 *               parcel:
                 *                 name: "Test Product 1"
                 *                 weight: 1
                 *                 width: 10
                 *                 length: 10
                 *                 height: 10
                 *               courier_code: "kerry"
                 *             - from:
                 *                 district_name: "บางรัก"
                 *                 state_name: "กรุงเทพมหานคร"
                 *                 postcode: "10500"
                 *               to:
                 *                 district_name: "จตุจักร"
                 *                 state_name: "กรุงเทพมหานคร"
                 *                 postcode: "10900"
                 *               parcel:
                 *                 name: "Test Product 2"
                 *                 weight: 2
                 *                 width: 15
                 *                 length: 15
                 *                 height: 15
                 *               courier_code: "flash"
                 *     responses:
                 *       200:
                 *         description: Successful operation - returns pricing for all items
                 *         content:
                 *           application/json:
                 *             schema:
                 *               type: array
                 *               items:
                 *                 type: object
                 *       400:
                 *         description: Bad request - invalid array or missing required fields
                 *       500:
                 *         description: Internal server error
                 */
                method: "post",
                path: "/price/check/multiple",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.shippingController.checkPriceMultiple.bind(this.shippingController),
            },
        ];
    }
}
export default new ShippingRouter().router;