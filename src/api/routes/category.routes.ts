import BaseRouter, { RouteConfig } from "./router";
import { CategoryController } from "../controllers/category.controller";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";

class CategoryRouter extends BaseRouter {
  private readonly categoryController: CategoryController;

  constructor() {
    super();
    this.categoryController = container.get<CategoryController>(TYPES.CategoryController);
  }

  protected routes(): RouteConfig[] {
    return [
      {
        /**
         * @swagger
         * /api/categories/:
         *   get:
         *     tags: [Category]
         *     summary: Get all categories
         *     responses:
         *       200:
         *         description: Successful operation
         */
        method: "get",
        path: "/",
        handler: this.categoryController.getAll.bind(this.categoryController),
      },
      {
        /**
         * @swagger
         * /api/categories/{id}:
         *   get:
         *     tags: [Category]
         *     summary: Get category by ID
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *         description: Category ID
         *     responses:
         *       200:
         *         description: Successful operation
         *       404:
         *         description: Category not found
         */
        method: "get",
        path: "/:id",
        handler: this.categoryController.getById.bind(this.categoryController),
      },
      {
        /**
         * @swagger
         * /api/categories/create:
         *   post:
         *     tags: [Category]
         *     summary: Create a new category
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
         *         description: Category created successfully
         *       400:
         *         description: Invalid input
         */
        method: "post",
        path: "/",
        handler: this.categoryController.create.bind(this.categoryController),
      },
    ];
  }
}

export default new CategoryRouter().router;
