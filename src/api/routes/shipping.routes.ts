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
                 * /api/shipping/price/check:
                 *   post:
                 *     tags: [Shipping]
                 *     summary: Check shipping price for a single item
                 *     description: Check shipping price for a single item
                 *     security:
                 *       - bearerAuth: []
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         application/json:
                 *           schema:
                 *             type: object
                 *             properties:
                 *               from:
                 *                 type: object
                 *                 properties:
                 *                   name:
                 *                     type: string
                 *                     example: "ผู้ส่ง ต้นทาง"
                 *                   address:
                 *                     type: string
                 *                     example: "บริษัท​ ชิปป๊อป​ จำกัด 1​"
                 *                   district:
                 *                     type: string
                 *                     example: "ถนนพญาไท"
                 *                   state:
                 *                     type: string
                 *                     example: "ราชเทวี"
                 *                   province:
                 *                     type: string
                 *                     example: "กรุงเทพมหานคร"
                 *                   postcode:
                 *                     type: string
                 *                     example: "10400"
                 *                   tel:
                 *                     type: string
                 *                     example: "0123456789"
                 *                   lat:
                 *                     type: string
                 *                     example: "13.7615902"
                 *                   lng:
                 *                     type: string
                 *                     example: "100.534519"
                 *               to:
                 *                 type: object
                 *                 properties:
                 *                   name:
                 *                     type: string
                 *                     example: "ผู้รับ ปลายทาง"
                 *                   address:
                 *                     type: string
                 *                     example: "บริษัท​ ชิปป๊อป​ จำกัด​ 2"
                 *                   district:
                 *                     type: string
                 *                     example: "สีลม"
                 *                   state:
                 *                     type: string
                 *                     example: "บางรัก"
                 *                   province:
                 *                     type: string
                 *                     example: "กรุงเทพมหานคร"
                 *                   postcode:
                 *                     type: string
                 *                     example: "10500"
                 *                   tel:
                 *                     type: string
                 *                     example: "0123456789"
                 *                   lat:
                 *                     type: string
                 *                     example: "13.7615902"
                 *                   lng:
                 *                     type: string
                 *                     example: "100.534519"
                 *               parcel:
                 *                 type: object
                 *                 properties:
                 *                   name:
                 *                     type: string
                 *                     example: "สินค้าชิ้นที่ 1"
                 *                   weight:
                 *                     type: number
                 *                     example: 18000
                 *                   width:
                 *                     type: number
                 *                     example: 30
                 *                   length:
                 *                     type: number
                 *                     example: 100
                 *                   height:
                 *                     type: number
                 *                     example: 30
                 *               courier_code:
                 *                 type: string
                 *                 example: "FLE"
                 *               showall:
                 *                 type: number
                 *                 example: 1
                 *             required:
                 *               - from
                 *               - to
                 *               - parcel
                 *               - courier_code
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 *         content:
                 *           application/json:
                 *             schema:
                 *               type: object
                 *       400:
                 *         description: Bad request - missing required fields
                 *       500:
                 *         description: Internal server error
                 */
                method: "post",
                path: "/price/check",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.shippingController.checkPrice.bind(this.shippingController),
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
                 *                     name:
                 *                       type: string
                 *                       example: "ผู้ส่ง ต้นทาง"
                 *                     address:
                 *                       type: string
                 *                       example: "บริษัท​ ชิปป๊อป​ จำกัด 1​"
                 *                     district:
                 *                       type: string
                 *                       example: "ถนนพญาไท"
                 *                     state:
                 *                       type: string
                 *                       example: "ราชเทวี"
                 *                     province:
                 *                       type: string
                 *                       example: "กรุงเทพมหานคร"
                 *                     postcode:
                 *                       type: string
                 *                       example: "10400"
                 *                     tel:
                 *                       type: string
                 *                       example: "0123456789"
                 *                     lat:
                 *                       type: string
                 *                       example: "13.7615902"
                 *                     lng:
                 *                       type: string
                 *                       example: "100.534519"
                 *                 to:
                 *                   type: object
                 *                   properties:
                 *                     name:
                 *                       type: string
                 *                       example: "ผู้รับ ปลายทาง"
                 *                     address:
                 *                       type: string
                 *                       example: "บริษัท​ ชิปป๊อป​ จำกัด​ 2"
                 *                     district:
                 *                       type: string
                 *                       example: "สีลม"
                 *                     state:
                 *                       type: string
                 *                       example: "บางรัก"
                 *                     province:
                 *                       type: string
                 *                       example: "กรุงเทพมหานคร"
                 *                     postcode:
                 *                       type: string
                 *                       example: "10500"
                 *                     tel:
                 *                       type: string
                 *                       example: "0123456789"
                 *                     lat:
                 *                       type: string
                 *                       example: "13.7615902"
                 *                     lng:
                 *                       type: string
                 *                       example: "100.534519"
                 *                 parcel:
                 *                   type: object
                 *                   properties:
                 *                     name:
                 *                       type: string
                 *                       example: "สินค้าชิ้นที่ 1"
                 *                     weight:
                 *                       type: number
                 *                       example: 18000
                 *                     width:
                 *                       type: number
                 *                       example: 30
                 *                     length:
                 *                       type: number
                 *                       example: 100
                 *                     height:
                 *                       type: number
                 *                       example: 30
                 *                 courier_code:
                 *                   type: string
                 *                   example: "FLE"
                 *                 showall:
                 *                   type: number
                 *                   example: 1
                 *               required:
                 *                 - from
                 *                 - to
                 *                 - parcel
                 *                 - courier_code
                 *           example:
                 *             - from:
                 *                 name: "ผู้ส่ง ต้นทาง 1"
                 *                 address: "บริษัท​ ชิปป๊อป​ จำกัด 1​"
                 *                 district: "ถนนพญาไท"
                 *                 state: "ราชเทวี"
                 *                 province: "กรุงเทพมหานคร"
                 *                 postcode: "10400"
                 *                 tel: "0123456789"
                 *                 lat: "13.7615902"
                 *                 lng: "100.534519"
                 *               to:
                 *                 name: "ผู้รับ ปลายทาง 1"
                 *                 address: "บริษัท​ ชิปป๊อป​ จำกัด​ 2"
                 *                 district: "สีลม"
                 *                 state: "บางรัก"
                 *                 province: "กรุงเทพมหานคร"
                 *                 postcode: "10500"
                 *                 tel: "0123456789"
                 *                 lat: "13.7615902"
                 *                 lng: "100.534519"
                 *               parcel:
                 *                 name: "สินค้าชิ้นที่ 1"
                 *                 weight: 18000
                 *                 width: 30
                 *                 length: 100
                 *                 height: 30
                 *               courier_code: "FLE"
                 *               showall: 1
                 *             - from:
                 *                 name: "ผู้ส่ง ต้นทาง 2"
                 *                 address: "บริษัท​ ชิปป๊อป​ จำกัด 1​"
                 *                 district: "ถนนพญาไท"
                 *                 state: "ราชเทวี"
                 *                 province: "กรุงเทพมหานคร"
                 *                 postcode: "10400"
                 *                 tel: "0123456789"
                 *               to:
                 *                 name: "ผู้รับ ปลายทาง 2"
                 *                 address: "บริษัท​ ชิปป๊อป​ จำกัด​ 2"
                 *                 district: "สีลม"
                 *                 state: "บางรัก"
                 *                 province: "กรุงเทพมหานคร"
                 *                 postcode: "10500"
                 *                 tel: "0123456789"
                 *               parcel:
                 *                 name: "สินค้าชิ้นที่ 2"
                 *                 weight: 1000
                 *                 width: 1
                 *                 length: 1
                 *                 height: 1
                 *               courier_code: "EMST"
                 *               showall: 1
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