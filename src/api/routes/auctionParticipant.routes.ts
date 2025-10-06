import BaseRouter, { RouteConfig } from "./router";
import AuctionParticipantController from "../controllers/auctionParticipant.controller";
import AuthMiddleware from "../middlewares/auth.middleware";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";

class AuctionParticipantRouter extends BaseRouter {
  private readonly auctionParticipantController: AuctionParticipantController;

  constructor() {
    super();
    this.auctionParticipantController = container.get<AuctionParticipantController>(TYPES.AuctionParticipantController);
  }

  protected routes(): RouteConfig[] {
    return [
      {
        /**
         * @swagger
         * /api/auctionParticipant/join:
         *   post:
         *     tags: [Auction Participant]
         *     summary: Join an auction
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               auctionId:
         *                 type: string
         *     responses:
         *       201:
         *         description: Successfully joined auction
         *       400:
         *         description: Invalid input
         *       401:
         *         description: Unauthorized
         */
        method: "post",
        path: "/",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.auctionParticipantController.create.bind(this.auctionParticipantController),
      },
      {
        /**
         * @swagger
         * /api/auctionParticipant/{auctionId}:
         *   get:
         *     tags: [Auction Participant]
         *     summary: Get participants by auction ID
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: auctionId
         *         required: true
         *         schema:
         *           type: string
         *         description: Auction ID
         *     responses:
         *       200:
         *         description: Successful operation
         *       404:
         *         description: Auction not found
         *       401:
         *         description: Unauthorized
         */
        method: "get",
        path: "/:auctionId",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.auctionParticipantController.getByAuction.bind(this.auctionParticipantController),
      },
      {
        /**
         * @swagger
         * /api/auctionParticipant/{id}/status:
         *   patch:
         *     tags: [Auction Participant]
         *     summary: Update participant status
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *         description: Participant ID
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               status:
         *                 type: string
         *                 enum: [pending, approved, rejected]
         *     responses:
         *       200:
         *         description: Status updated successfully
         *       400:
         *         description: Invalid input
         *       401:
         *         description: Unauthorized
         *       404:
         *         description: Participant not found
         */
        method: "patch",
        path: "/:id/status",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.auctionParticipantController.updateStatus.bind(this.auctionParticipantController),
      },
    ];
  }
}

export default new AuctionParticipantRouter().router;
