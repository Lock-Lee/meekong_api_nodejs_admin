import BaseRouter, { RouteConfig } from "./router";
import { SellerShopController } from "@controllers/sellerShop.controller";
import AuthMiddleware from "../middlewares/auth.middleware";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";


export class SellerShopRouter extends BaseRouter {
    private readonly sellerShopController: SellerShopController;

    constructor() {
        super();
        this.sellerShopController = container.get<SellerShopController>(TYPES.SellerShopController);
    }

    protected routes(): RouteConfig[] {
        return [

            {
                /**
                 * @swagger
                 * /api/seller-shop/items-by-seller:
                 *   get:
                 *     tags: [Seller Shop]
                 *     summary: Get items by user ID
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: query
                 *         name: userId
                 *         example: "0198a3ec-4e2c-7223-b417-534231036d7d"
                 *         required: true
                 *         schema:
                 *           type: string
                 *         description: User ID
                 *       - in: query
                 *         name: itemId
                 *         example: "eff526b4-0512-4509-b62b-e479d8f5f509"
                 *         required: false
                 *         schema:
                 *         type: string
                 *         description: Item ID
                 *       - in: query
                 *         name: keyword
                 *         required: false
                 *         schema:
                 *           type: string
                 *         description: Free-text search across item names
                 *       - in: query
                 *         name: categoryId
                 *         required: false
                 *         schema:
                 *           type: array
                 *           items:
                 *             type: string
                 *         style: form
                 *         explode: true
                 *         example: ["11caecea-a7cb-4983-bc1e-3c50486b3587", "29a0a08f-bf80-47a6-b9bf-3626cc29b75b"]
                 *         description: Filter by one or more category IDs
                 *       - in: query
                 *         name: sellType
                 *         required: false
                 *         schema:
                 *           type: array
                 *           items:
                 *             type: string
                 *             enum: [NORMAL, AUCTION, SATISFY]
                 *         style: form
                 *         explode: true
                 *         example: ["NORMAL", "AUCTION"]
                 *         description: Filter by selling type(s)
                 *       - in: query
                 *         name: status
                 *         required: false
                 *         schema:
                 *           type: string
                 *           enum: [ACTIVE, INACTIVE]
                 *         explode: true
                 *         example: "ACTIVE"
                 *         description: Filter by status
                 *       - in: query
                 *         name: itemType
                 *         required: false
                 *         schema:
                 *           type: array
                 *           items:
                 *             type: string
                 *             enum: [NEW, USED]
                 *         style: form
                 *         explode: true
                 *         example: ["NEW", "USED"]
                 *         description: Filter by product condition (NEW or USED)
                 *       - in: query
                 *         name: minPrice
                 *         required: false
                 *         schema:
                 *           type: number
                 *           format: float
                 *         example: 0
                 *         description: Minimum price range filter
                 *       - in: query
                 *         name: maxPrice
                 *         required: false
                 *         schema:
                 *           type: number
                 *           format: float
                 *         example: 30000
                 *         description: Maximum price range filter
                 *       - in: query
                 *         name: auctionStatus
                 *         required: false
                 *         schema:
                 *           type: string
                 *           enum: [NOT_STARTED, IN_PROGRESS, COMPLETED]
                 *           example: "NOT_STARTED"
                 *         description: Filter by auction status (NOT_STARTED = ยังไม่เริ่ม, IN_PROGRESS = กำลังประมูล, COMPLETED = มีผู้ชนะ)
                 *       - in: query
                 *         name: satisfyStatus
                 *         required: false
                 *         schema:
                 *           type: string
                 *           enum: [SELLING , COMPLETED]
                 *           example: "SELLING"
                 *         description: Filter by satisfy status (SELLING = กำลังขาย, COMPLETED = ขายเสร็จสิ้น)
                 *       - in: query
                 *         name: page
                 *         required: false
                 *         schema:
                 *           type: integer
                 *           minimum: 1
                 *         example: 1
                 *         description: Page number for pagination
                 *       - in: query
                 *         name: take
                 *         required: false
                 *         schema:
                 *           type: integer
                 *           minimum: 1
                 *           maximum: 100
                 *         example: 20
                 *         description: Page size (number of items per page) 
                 *       - in: query
                 *         name: sortBy
                 *         required: false
                 *         schema:
                 *           type: string
                 *           enum: [createdAt,  updatedAt ,price]
                 *           example: "createdAt"
                 *         description: Sort by (createdAt, price, updatedAt)
                 *       - in: query
                 *         name: sortOrder
                 *         required: false
                 *         schema:
                 *           type: string
                 *           enum: [asc, desc]
                 *           example: "asc"
                 *         description: Sort order (asc, desc)
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 *       400:
                 *         description: Invalid input
                 *       401:
                 *         description: Unauthorized
                 *       404:
                 *         description: Seller not found
                 */
                path: "/items-by-seller",
                method: "get",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.sellerShopController.getItemsBySellerId.bind(this.sellerShopController)
            },

        ];
    }
}
export default new SellerShopRouter().router;


