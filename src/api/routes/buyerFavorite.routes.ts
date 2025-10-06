import BaseRouter, { RouteConfig } from "./router";
import { BuyerFavoriteController } from "@api/controllers/buyerFavorite.controller";
import AuthMiddleware from "../middlewares/auth.middleware";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";

class BuyerFavoriteRouter extends BaseRouter {
  private readonly buyerFavoriteController: BuyerFavoriteController;

  constructor() {
    super();
    this.buyerFavoriteController = container.get<BuyerFavoriteController>(TYPES.BuyerFavoriteController);
  }

  protected routes(): RouteConfig[] {
    return [


      {
        /**
         * @swagger
         * /api/buyer-favorite/:
         *   post:
         *     tags: [Buyer Favorite]
         *     summary: Add a new favorite item
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
         *                 description: ID of the user
         *               itemId:
         *                 type: string
         *                 description: ID of the item to be added as favorite
         *               variantId:
         *                 type: string
         *                 description: (Optional) ID of the item variant
         *             required:
         *               - userId
         *               - itemId
         *     parameters:
         *       - in: query
         *         name: requestId
         *         schema:
         *           type: string
         *         required: true
         *         description: Request ID for tracking
         *     responses:
         *       201:
         *         description: Favorite added successfully
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/BuyerFavorite'
         *       400:
         *         description: Invalid input data
         *       401:
         *         description: Unauthorized
         */
        method: "post",
        path: "/",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.buyerFavoriteController.create.bind(this.buyerFavoriteController),
      },

      {
        /**
         * @swagger
         * /api/buyer-favorite/:
         *   get:
         *     tags: [Buyer Favorite]
         *     summary: Get all favorites for the current user
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: query
         *         name: requestId
         *         schema:
         *           type: string
         *         required: true
         *         description: Request ID for tracking
         *     responses:
         *       200:
         *         description: List of favorites
         *         content:
         *           application/json:
         *             schema:
         *               type: array
         *               items:
         *                 $ref: '#/components/schemas/BuyerFavorite'
         *       401:
         *         description: Unauthorized
         */
        method: "get",
        path: "/",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.buyerFavoriteController.getAll.bind(this.buyerFavoriteController),
      },
      {
        /**
         * @swagger
         * /api/buyer-favorite/{id}:
         *   delete:
         *     tags: [Buyer Favorite]
         *     summary: Remove a favorite
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *         description: Favorite ID to remove
         *       - in: query
         *         name: requestId
         *         schema:
         *           type: string
         *         required: true
         *         description: Request ID for tracking
         *     responses:
         *       200:
         *         description: Favorite removed successfully
         *       401:
         *         description: Unauthorized
         *       404:
         *         description: Favorite not found
         */
        method: "delete",
        path: "/:id",
        // middlewares: [AuthMiddleware.authenticateUser],
        handler: this.buyerFavoriteController.delete.bind(this.buyerFavoriteController),
      },

    ];
  }
}

export default new BuyerFavoriteRouter().router;
