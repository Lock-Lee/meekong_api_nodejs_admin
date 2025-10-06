import BaseRouter, { RouteConfig } from "./router";
import { BuyerShopController } from "@controllers/buyerShop.controller";
import AuthMiddleware from "../middlewares/auth.middleware";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";


export class BuyerShopRouter extends BaseRouter {
    private readonly buyerShopController: BuyerShopController;

    constructor() {
        super();
        this.buyerShopController = container.get<BuyerShopController>(TYPES.BuyerShopController);
    }

    protected routes(): RouteConfig[] {
        return [
           
            {
                /**
                 * @swagger
                 * /api/buyer-shop/seller-profile:
                 *   get:
                 *     tags: [Buyer Shop]
                 *     summary: Get seller profile by ID
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *      - in: query
                 *        name: userId
                 *        example: "0198a3ec-4e2c-7223-b417-534231036d7d"
                 *        schema:
                 *          type: string
                 *        required: true
                 *        description: User ID
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 *       400:
                 *         description: Invalid input
                 *       401:
                 *         description: Unauthorized
                 *       404:
                 *         description: Profile not found
                 */

                path: "/seller-profile",
                method: "get",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.buyerShopController.getSellerProfileById.bind(this.buyerShopController)
            },
            {
                /**
                 * @swagger
                 * /api/buyer-shop/items-by-seller:
                 *   get:
                 *     tags: [Buyer Shop]
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
                handler: this.buyerShopController.getItemsBySellerId.bind(this.buyerShopController)
            },
            {
                /**
                 * @swagger
                 * /api/buyer-shop/category-by-seller:
                 *   get:
                 *     tags: [Buyer Shop]
                 *     summary: Get category by seller ID
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
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 *       400:
                 *         description: Invalid input
                 *       401:
                 *         description: Unauthorized
                 *       404:
                 *         description: Category not found
                 */
                path: "/category-by-seller",
                method: "get",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.buyerShopController.getCategoryBySellerId.bind(this.buyerShopController)
            },
            {
                /**
                 * @swagger
                 * /api/buyer-shop/seller-reviews:
                 *   get:
                 *     tags: [Buyer Shop]
                 *     summary: Get all buyer reviews (reuse buyerReviewController.getAll)
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *      - in: query
                 *        name: userId
                 *        schema:
                 *          type: string
                 *        example: "0198a3ec-4e2c-7223-b417-534231036d7d"
                 *        required: true
                 *        description: User ID
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 */
                path: "/seller-reviews",
                method: "get",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.buyerShopController.getAllSellerReviews.bind(this.buyerShopController)
            },


        ];
    }
}
export default new BuyerShopRouter().router;

  
