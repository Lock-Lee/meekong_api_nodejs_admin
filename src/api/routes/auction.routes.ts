import BaseRouter, { RouteConfig } from "./router";
import AuctionController from "../controllers/auction.controller";
import AuthMiddleware from "../middlewares/auth.middleware";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";

class AuctionRouter extends BaseRouter {
  private readonly auctionController: AuctionController;

  constructor() {
    super();
    this.auctionController = container.get<AuctionController>(TYPES.AuctionController);
  }

  protected routes(): RouteConfig[] {
    return [
      {
        /**
         * @swagger
         * /api/auction/:
         *   get:
         *     tags: [Auction]
         *     summary: Get all auctions
         *     responses:
         *       200:
         *         description: Successful operation
         */
        method: "get",
        path: "/",
        handler: this.auctionController.list.bind(this.auctionController),
      },
      {
        /**
         * @swagger
         * /api/auction/:
         *   post:
         *     tags: [Auction]
         *     summary: Create a new auction
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               name:
         *                 type: string
         *               description:
         *                 type: string
         *               startDate:
         *                 type: string
         *                 format: date-time
         *               endDate:
         *                 type: string
         *                 format: date-time
         *               itemId:
         *                 type: string
         *     responses:
         *       201:
         *         description: Auction created successfully
         *       400:
         *         description: Invalid input
         *       401:
         *         description: Unauthorized
         */
        method: "post",
        path: "/",
        // middlewares: [AuthMiddleware.authenticateUser],
        handler: this.auctionController.create.bind(this.auctionController),
      },
      {
        /**
         * @swagger
         * /api/auction/{id}:
         *   get:
         *     tags: [Auction]
         *     summary: Get auction by ID
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *         description: Auction ID
         *     responses:
         *       200:
         *         description: Successful operation
         *       404:
         *         description: Auction not found
         */
        method: "get",
        path: "/:id",
        handler: this.auctionController.getById.bind(this.auctionController),
      },
    ];
  }
}

export default new AuctionRouter().router;
