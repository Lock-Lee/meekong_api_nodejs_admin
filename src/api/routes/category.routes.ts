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
         * /api/categories/children/tree:
         *   get:
         *     tags: [Category]
         *     summary: Get category children (with descendants)
         *     parameters:
         *       - in: query
         *         name: parentId
         *         required: false
         *         schema:
         *           type: string
         *         description: Parent category ID to fetch descendants for
         *       - in: query
         *         name: page
         *         required: false
         *         schema:
         *           type: integer
         *           minimum: 1
         *           default: 1
         *         description: Page number (1-based). Defaults to 1.
         *     responses:
         *       200:
         *         description: Successful operation
         */
        method: "get",
        path: "/children/tree",
        handler: this.categoryController.getAllwithpage.bind(this.categoryController),
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
         * /api/categories/{id}/size-units:
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
        path: "/:id/size-units",
        handler: this.categoryController.getBySizeUnit.bind(this.categoryController),
      },

      {
        /**
         * @swagger
         * /api/categories/{id}/tags:
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
        path: "/:id/tags",
        handler: this.categoryController.getByTags.bind(this.categoryController),
      },

      /**
       * @swagger
       * /api/categories/{id}/size-units/{sizeUnitId}:
       *   get:
       *     tags: [Category]
       *     summary: Get size unit by category and sizeUnitId
       *     parameters:
       *       - in: path
       *         name: id
       *         required: true
       *         schema:
       *           type: string
       *         description: Category ID
       *       - in: path
       *         name: sizeUnitId
       *         required: true
       *         schema:
       *           type: string
       *         description: Size Unit ID
       *     responses:
       *       200:
       *         description: Successful operation
       *       404:
       *         description: Not found
       */
      {
        method: "get",
        path: "/:id/size-units/:sizeUnitId",
        handler: this.categoryController.getBySizeUnitId.bind(this.categoryController),
      },

      {
        /**
       * @swagger
       * /api/categories:
       *   post:
       *     tags: [Category]
       *     summary: Create a new category
       *     requestBody:
       *       required: true
       *       content:
       *         multipart/form-data:
       *           schema:
       *             type: object
       *             properties:
       *               nameTh:
       *                 type: string
       *               nameEn:
       *                 type: string
       *               level:
       *                 type: integer
       *               parentId:
       *                 type: string
       *                 nullable: true
       *               images:
       *                 type: array
       *                 items:
       *                   type: string
       *                   format: binary
       *                 description: Images
       *               tag:
       *                 type: array
       *                 items:
       *                   type: string
       *                 description: Array of Tag IDs to link
       *               items:
       *                 type: array
       *                 items:
       *                   type: string
       *                 description: Array of items IDs to link
       *             required:
       *               - nameTh
       *               - nameEn
       *               - level
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
      {
        /**
         * @swagger
         * /api/categories/bulk:
         *   post:
         *     tags: [Category]
         *     summary: Create multiple categories at once
         *     requestBody:
         *       required: true
         *       content:
         *         multipart/form-data:
         *           schema:
         *             type: object
         *             properties:
         *               items:
         *                 type: string
         *                 description: JSON string of Category payloads; include "id" to update, omit to create
         *               images:
         *                 type: array
         *                 items:
         *                   type: string
         *                   format: binary
         *     responses:
         *       201:
         *         description: Categories created successfully
         *       400:
         *         description: Invalid input
         */
        method: "post",
        path: "/bulk",
        handler: this.categoryController.createMany.bind(this.categoryController),
      },
      {
        /**
         * @swagger
         * /api/categories/{id}:
         *   patch:
         *     tags: [Category]
         *     summary: Update a category
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *         description: Category ID
         *     requestBody:
         *       required: true
         *       content:
         *         multipart/form-data:
         *           schema:
         *             type: object
         *             properties:
         *               nameTh:
         *                 type: string
         *               nameEn:
         *                 type: string
         *               level:
         *                 type: number
         *               images:
         *                 type: array
         *                 items:
         *                   type: string
         *                   format: binary
         *                 description: Images
         *               tag:
         *                 type: array
         *                 items:
         *                   type: string
         *                 description: Array of Tag IDs to link
         *               items:
         *                 type: array
         *                 items:
         *                   type: string
         *                 description: Array of items IDs to link
         *             required:
         *               - nameTh
         *               - nameEn
         *               - level
         *     responses:
         *       201:
         *         description: Category Update successfully
         *       400:
         *         description: Invalid input
         */
        method: "patch",
        path: "/:id",
        handler: this.categoryController.update.bind(this.categoryController),
      },
      {
        /**
         * @swagger
         * /api/categories/{id}:
         *   delete:
         *     tags: [Category]
         *     summary: Delete category by ID
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
        method: "delete",
        path: "/:id",
        handler: this.categoryController.delete.bind(this.categoryController),
      },

    ];
  }
}

export default new CategoryRouter().router;
