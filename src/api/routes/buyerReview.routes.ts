import BaseRouter, { RouteConfig } from "./router";
import { BuyerReviewController } from "@controllers/buyerReview.controller";
import AuthMiddleware from "../middlewares/auth.middleware";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";

class BuyerReviewRouter extends BaseRouter {
    private readonly buyerReviewController: BuyerReviewController;

    constructor() {
        super();
        this.buyerReviewController = container.get<BuyerReviewController>(TYPES.BuyerReviewController);
    }

    protected routes(): RouteConfig[] {
        return [
            {
                /**
                 * @swagger
                 * /api/buyer-review:
                 *   get:
                 *     tags: [Buyer Review]
                 *     summary: Get all buyer reviews
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: query
                 *         name: userId
                 *         schema:
                 *           type: string
                 *         required: true
                 *         description: User ID
                 *       - in: query
                 *         name: shopId
                 *         schema:
                 *           type: string
                 *         required: false
                 *         description: Shop ID
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 */
                method: "get",
                path: "/",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.buyerReviewController.getAll.bind(this.buyerReviewController),
            },
            {
                /**
                 * @swagger
                 * /api/buyer-review/{id}:
                 *   get:
                 *     tags: [Buyer Review]
                 *     summary: Get buyer review by ID
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: id
                 *         schema:
                 *           type: string
                 *         required: true
                 *         description: Buyer review ID
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 */
                method: "get",
                path: "/:id",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.buyerReviewController.getById.bind(this.buyerReviewController),
            },
            {
                /**
                 * @swagger
                 * /api/buyer-review:
                 *   post:
                 *     tags: [Buyer Review]
                 *     summary: Create a new buyer review
                 *     security:
                 *       - bearerAuth: []
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         multipart/form-data:
                 *           schema:
                 *             type: object
                 *             properties:
                 *               userId:
                 *                 type: string
                 *                 format: uuid
                 *                 description: User UUID
                 *               shopId:
                 *                 type: string
                 *                 format: uuid
                 *                 description: Shop UUID
                 *               rating:
                 *                 type: number
                 *                 description: Rating
                 *               comment:
                 *                 type: string
                 *                 description: Comment
                 *               images:
                 *                 type: array
                 *                 items:
                 *                   type: string
                 *                   format: binary
                 *                 description: Images
                 *               status:
                 *                 type: string
                 *                 description: Status
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 */
                method: "post",
                path: "/",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.buyerReviewController.create.bind(this.buyerReviewController),
            },
        ];
    }
}
export default new BuyerReviewRouter().router;