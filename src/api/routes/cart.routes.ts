import BaseRouter, { RouteConfig } from "./router";
import CartController from "../controllers/cart.controller";
import AuthMiddleware from "../middlewares/auth.middleware";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";

class CartRouter extends BaseRouter {
  private readonly cartController: CartController;

  constructor() {
    super();
    this.cartController = container.get<CartController>(TYPES.CartController);
  }

  protected routes(): RouteConfig[] {
    return [
      {
        /**
         * @swagger
         * /api/cart/get-satisfy:
         *   get:
         *     tags: [Cart]
         *     summary: Get a list of satisfies
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: query
         *         name: page
         *         schema:
         *           type: integer
         *           default: 1
         *         description: The page number to retrieve.
         *       - in: query
         *         name: pageSize
         *         schema:
         *           type: integer
         *           default: 10
         *         description: The number of items to retrieve per page.
         *     responses:
         *       200:
         *         description: A paginated list of satisfies.
         *       401:
         *         description: Unauthorized.
         */
        method: "get",
        path: "/get-satisfy",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.cartController.getSatisfy.bind(this.cartController),
      },
      {
        /**
         * @swagger
         * /api/cart/get-auction:
         *   get:
         *     tags: [Cart]
         *     summary: Get a list of auctions
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: query
         *         name: page
         *         schema:
         *           type: integer
         *           default: 1
         *         description: The page number to retrieve.
         *       - in: query
         *         name: pageSize
         *         schema:
         *           type: integer
         *           default: 10
         *         description: The number of items to retrieve per page.
         *     responses:
         *       200:
         *         description: A paginated list of auctions.
         *       401:
         *         description: Unauthorized.
         */
        method: "get",
        path: "/get-auction",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.cartController.getAuction.bind(this.cartController),
      },
      {
        /**
         * @swagger
         * /api/cart/get:
         *   get:
         *     tags: [Cart]
         *     summary: Get user's cart
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: Successful operation
         *       401:
         *         description: Unauthorized
         */
        method: "get",
        path: "/get",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.cartController.get.bind(this.cartController),
      },
      {
        /**
         * @swagger
         * /api/cart/manage:
         *   post:
         *     tags: [Cart]
         *     summary: Manage item in cart
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               itemId:
         *                 type: string
         *               quantity:
         *                 type: integer
         *     responses:
         *       200:
         *         description: Successful operation
         *       400:
         *         description: Invalid input
         *       401:
         *         description: Unauthorized
         */
        method: "post",
        path: "/manage", // Changed path to /manage
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.cartController.manageCartItem.bind(this.cartController), // Changed handler to manageCartItem
      },
    ];
  }
}

export default new CartRouter().router;
