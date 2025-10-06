import BaseRouter, { RouteConfig } from "./router";
import BidController from "../controllers/bid.controller";
import AuthMiddleware from "../middlewares/auth.middleware";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";

class BidRouter extends BaseRouter {
  private readonly bidController: BidController;

  constructor() {
    super();
    this.bidController = container.get<BidController>(TYPES.BidController);
  }

  protected routes(): RouteConfig[] {
    return [
      {
        /**
         * @swagger
         * /api/bid/getAll:
         *   get:
         *     tags: [Bid]
         *     summary: Get all bids
         *     responses:
         *       200:
         *         description: Successful operation
         */
        method: "get",
        path: "/",
        handler: this.bidController.list.bind(this.bidController),
      },
      {
        /**
         * @swagger
         * /api/bid/create:
         *   post:
         *     tags: [Bid]
         *     summary: Create a new bid
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               amount:
         *                 type: number
         *               auctionId:
         *                 type: string
         *     responses:
         *       201:
         *         description: Bid created successfully
         *       400:
         *         description: Invalid input
         *       401:
         *         description: Unauthorized
         */
        method: "post",
        path: "/",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.bidController.create.bind(this.bidController),
      },
      {
        /**
         * @swagger
         * /api/bid/getById/{id}:
         *   get:
         *     tags: [Bid]
         *     summary: Get bid by ID
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *         description: Bid ID
         *     responses:
         *       200:
         *         description: Successful operation
         *       404:
         *         description: Bid not found
         */
        method: "get",
        path: "/:id",
        handler: this.bidController.getBidById.bind(this.bidController),
      },
    ];
  }
}

export default new BidRouter().router;
