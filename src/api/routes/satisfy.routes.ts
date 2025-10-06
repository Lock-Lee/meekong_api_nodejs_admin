import BaseRouter, { RouteConfig } from "./router";
import { SatisfyController } from "../controllers/satisfy.controller";
import AuthMiddleware from "../middlewares/auth.middleware";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";

class SatisfyRouter extends BaseRouter {
  private readonly satisfyController: SatisfyController;

  constructor() {
    super();
    this.satisfyController = container.get<SatisfyController>(TYPES.SatisfyController);
  }
  protected routes(): RouteConfig[] {
    return [
      
      {
        /**
         * @swagger
         * /api/satisfy/monitor-status:
         *   get:
         *     tags: [Satisfy]
         *     summary: Get satisfy list (grouped by buyer, highest price first)
         *     parameters:
         *       - in: query
         *         name: page
         *         required: false
         *         schema:
         *           type: integer
         *           default: 1
         *         description: Page number (1-based)
         *       - in: query
         *         name: itemId
         *         required: false
         *         schema:
         *           type: string
         *           format: uuid
         *         description: Filter by itemId
         *       - in: query
         *         name: status
         *         required: false
         *         schema:
         *           type: string
         *           items:
         *             type: string
         *             enum: ["OPEN", "ACCEPTED", "CANCELED", "EXPIRED", "NONE", "ADJUST", "REJECT"]
         *         style: form
         *         explode: false
         *         description: Filter by multiple statuses
         *       - in: query
         *         name: statusFilter
         *         required: false
         *         schema:
         *           type: string
         *           enum: ["PENDING", "WAITING_TO_PAY", "COMPLETED"]
         *         description: Filter by status 
         *     responses:
         *       200:
         *         description: Successful operation
         */
        method: "get",
        path: "/monitor-status",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.satisfyController.listMonitorStatus.bind(this.satisfyController),
      },
      {
        /**
         * @swagger
         * /api/satisfy:
         *   get:
         *     tags: [Satisfy]
         *     summary: Get satisfy list (grouped by buyer, highest price first)
         *     parameters:
         *       - in: query
         *         name: page
         *         required: false
         *         schema:
         *           type: integer
         *           default: 1
         *         description: Page number (1-based)
         *       - in: query
         *         name: itemId
         *         required: false
         *         schema:
         *           type: string
         *           format: uuid
         *         description: Filter by itemId
         *       - in: query
         *         name: status
         *         required: false
         *         schema:
         *           type: string
         *           items:
         *             type: string
         *             enum: ["OPEN", "ACCEPTED", "CANCELED", "EXPIRED", "NONE", "ADJUST", "REJECT"]
         *         style: form
         *         explode: false
         *         description: Filter by multiple statuses
         *       - in: query
         *         name: statusFilter
         *         required: false
         *         schema:
         *           type: string
         *           enum: ["PENDING", "WAITING_TO_PAY", "COMPLETED"]
         *         description: Filter by status 
         *     responses:
         *       200:
         *         description: Successful operation
         */
        method: "get",
        path: "/",
        // middlewares: [AuthMiddleware.authenticateUser],
        handler: this.satisfyController.list.bind(this.satisfyController),
      },
      {
        /**
         * @swagger
         * /api/satisfy/create:
         *   post:
         *     tags: [Satisfy]
         *     summary: Create a new satisfaction entry
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
         *               rating:
         *                 type: number
         *               comment:
         *                 type: string
         *     responses:
         *       201:
         *         description: Satisfaction entry created successfully
         *       400:
         *         description: Invalid input
         *       401:
         *         description: Unauthorized
         */
        method: "post",
        path: "/",
        // middlewares: [AuthMiddleware.authenticateUser],
        handler: this.satisfyController.create.bind(this.satisfyController),
      },
      {
        /**
         * @swagger
         * /api/satisfy/{id}:
         *   get:
         *     tags: [Satisfy]
         *     summary: Get satisfaction entry by ID
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *           format: uuid
         *         description: Satisfy ID
         *       - in: query
         *         name: buyerId
         *         required: false
         *         schema:
         *           type: string
         *           format: uuid
         *         description: Optionally filter by buyer ID
         *     responses:
         *       200:
         *         description: Successful operation
         *       404:
         *         description: Entry not found
         *       401:
         *         description: Unauthorized
         */
        method: "get",
        path: "/:id",
        // middlewares: [AuthMiddleware.authenticateUser],
        handler: this.satisfyController.getById.bind(this.satisfyController),
      },

    ];
  }
}

export default new SatisfyRouter().router;
