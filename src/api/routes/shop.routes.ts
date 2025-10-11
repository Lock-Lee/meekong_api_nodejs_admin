import BaseRouter, { RouteConfig } from "./router";
import { ShopController } from "../controllers/shop.controller";
import AuthMiddleware from "../middlewares/auth.middleware";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";

class ShopRouter extends BaseRouter {
    private readonly shopController: ShopController;

    constructor() {
        super();
        this.shopController = container.get<ShopController>(TYPES.ShopController);
    }

    protected routes(): RouteConfig[] {
        return [
            {
                /**
                 * @swagger
                 * /api/shop/seller/{sellerId}:
                 *   get:
                 *     tags: [Shop]
                 *     summary: Get shop by seller ID
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: sellerId
                 *         required: true
                 *         schema:
                 *           type: string
                 *           format: uuid
                 *         description: Seller ID (User ID)
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 *         content:
                 *           application/json:
                 *             schema:
                 *               type: object
                 *               properties:
                 *                 id:
                 *                   type: string
                 *                   format: uuid
                 *                 name:
                 *                   type: string
                 *                 description:
                 *                   type: string
                 *                 slug:
                 *                   type: string
                 *                 avatarUrl:
                 *                   type: string
                 *                 bannerUrl:
                 *                   type: string
                 *                 sellerId:
                 *                   type: string
                 *                   format: uuid
                 *                 averageRating:
                 *                   type: number
                 *                 totalReviews:
                 *                   type: integer
                 *                 views:
                 *                   type: integer
                 *                 status:
                 *                   type: string
                 *                 createdAt:
                 *                   type: string
                 *                   format: date-time
                 *                 updatedAt:
                 *                   type: string
                 *                   format: date-time
                 *       404:
                 *         description: Shop not found
                 *       401:
                 *         description: Unauthorized
                 */
                method: "get",
                path: "/seller/:sellerId",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.shopController.getBySellerId.bind(this.shopController),
            },
            {
                /**
                 * @swagger
                 * /api/shop/seller/{sellerId}:
                 *   post:
                 *     tags: [Shop]
                 *     summary: Create or update shop (Upsert)
                 *     description: |
                 *       สร้างร้านค้าใหม่ หรือ อัปเดตร้านค้าที่มีอยู่แล้ว โดยใช้ sellerId ในการตรวจสอบ
                 *       - ถ้ามีร้านค้าอยู่แล้ว จะทำการอัปเดต
                 *       - ถ้าไม่มีร้านค้า จะสร้างร้านค้าใหม่
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: sellerId
                 *         required: true
                 *         schema:
                 *           type: string
                 *           format: uuid
                 *         description: Seller ID (User ID)
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         multipart/form-data:
                 *           schema:
                 *             type: object
                 *             required:
                 *               - name
                 *             properties:
                 *               name:
                 *                 type: string
                 *                 description: ชื่อร้านค้า
                 *                 example: My Awesome Shop
                 *               description:
                 *                 type: string
                 *                 description: รายละเอียดร้านค้า
                 *                 example: We sell the best products!
                 *               avatarImage:
                 *                 type: string
                 *                 format: binary
                 *                 description: รูปโปรไฟล์ร้านค้า (JPEG, PNG, WebP, max 5MB)
                 *               bannerImage:
                 *                 type: string
                 *                 format: binary
                 *                 description: รูปแบนเนอร์ร้านค้า (JPEG, PNG, WebP, max 5MB)
                 *         application/json:
                 *           schema:
                 *             type: object
                 *             required:
                 *               - name
                 *             properties:
                 *               name:
                 *                 type: string
                 *                 description: ชื่อร้านค้า
                 *                 example: My Awesome Shop
                 *               description:
                 *                 type: string
                 *                 description: รายละเอียดร้านค้า
                 *                 example: We sell the best products!
                 *     responses:
                 *       200:
                 *         description: Shop created or updated successfully
                 *         content:
                 *           application/json:
                 *             schema:
                 *               type: object
                 *               properties:
                 *                 id:
                 *                   type: string
                 *                   format: uuid
                 *                 name:
                 *                   type: string
                 *                 description:
                 *                   type: string
                 *                 slug:
                 *                   type: string
                 *                 avatarUrl:
                 *                   type: string
                 *                 bannerUrl:
                 *                   type: string
                 *                 sellerId:
                 *                   type: string
                 *                   format: uuid
                 *                 averageRating:
                 *                   type: number
                 *                 totalReviews:
                 *                   type: integer
                 *                 views:
                 *                   type: integer
                 *                 status:
                 *                   type: string
                 *                 createdAt:
                 *                   type: string
                 *                   format: date-time
                 *                 updatedAt:
                 *                   type: string
                 *                   format: date-time
                 *       400:
                 *         description: Invalid input
                 *       401:
                 *         description: Unauthorized
                 */
                method: "post",
                path: "/seller/:sellerId",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.shopController.upsert.bind(this.shopController),
            },
        ];
    }
}

export default new ShopRouter().router;
