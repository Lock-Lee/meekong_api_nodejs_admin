import BaseRouter, { RouteConfig } from "./router";
import { BrandController } from "../controllers/brand.controller";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import AuthMiddleware from "@api/middlewares/auth.middleware";

class BrandRouter extends BaseRouter {
    private readonly brandController: BrandController;

    constructor() {
        super();
        this.brandController = container.get<BrandController>(TYPES.BrandController);
    }

    protected routes(): RouteConfig[] {
        return [
            {
                /**
                 * @swagger
                 * /api/brand:
                 *   get:
                 *     tags: [Brand]
                 *     summary: Get all brands
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 */
                method: "get",
                path: "/",
                handler: this.brandController.list.bind(this.brandController),
            },
            {
                /**
                 * @swagger
                 * /api/brand:
                 *   post:
                 *     tags: [Brand]
                 *     summary: Create a new brand
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         application/json:
                 *           schema:
                 *             type: object
                 *             properties:
                 *               name:
                 *                 type: string
                 *     responses:
                 *       201:
                 *         description: Brand created successfully
                 *       400:
                 *         description: Invalid input
                 */
                method: "post",
                path: "/",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.brandController.create.bind(this.brandController),
            },
        ];
    }
}

export default new BrandRouter().router;
