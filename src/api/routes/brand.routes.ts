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
                 * /api/brand/{id}:
                 *   get:
                 *     tags: [Brand]
                 *     summary: Get  brands by Id
                 *     parameters:
                 *       - in: path
                 *         name: id
                 *         required: true
                 *         schema:
                 *           type: string
                 *         description: The ID of the brand to get data
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 */
                method: "get",
                path: "/:id",
                handler: this.brandController.listbyId.bind(this.brandController),
            },
            {
                /**
                 * @swagger
                 * /api/brand/{id}:
                 *   delete:
                 *     tags: [Brand]
                 *     summary: Delete brands by Id
                 *     parameters:
                 *       - in: path
                 *         name: id
                 *         required: true
                 *         schema:
                 *           type: string
                 *         description: The ID of the brand to delete data
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 */
                method: "delete",
                path: "/:id",
                handler: this.brandController.deletebyId.bind(this.brandController),
            },
            {
                /**
                 * @swagger
                 * /api/brand:
                 *   post:
                 *     tags: [Brand]
                 *     summary: Create a new brand
                 *     description: Create a new brand with Thai and English names, createdById, and optional image upload.
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         multipart/form-data:
                 *           schema:
                 *             type: object
                 *             properties:
                 *               nameTh:
                 *                 type: string
                 *                 description: Brand name in Thai
                 *                 example: แบรนด์ทดสอบ
                 *               nameEn:
                 *                 type: string
                 *                 description: Brand name in English
                 *                 example: Test Brand
                 *               createdById:
                 *                 type: string
                 *                 description: ID of the user who created the brand
                 *                 example: 12345
                 *               image:
                 *                 type: string
                 *                 format: binary
                 *                 description: Optional brand image file
                 *     responses:
                 *       201:
                 *         description: Brand created successfully
                 *         content:
                 *           application/json:
                 *             schema:
                 *               type: object
                 *               properties:
                 *                 success:
                 *                   type: boolean
                 *                   example: true
                 *                 message:
                 *                   type: string
                 *                   example: Brand created successfully.
                 *                 data:
                 *                   type: object
                 *                   properties:
                 *                     id:
                 *                       type: string
                 *                       example: 67890
                 *                     nameTh:
                 *                       type: string
                 *                       example: แบรนด์ทดสอบ
                 *                     nameEn:
                 *                       type: string
                 *                       example: Test Brand
                 *                     createdById:
                 *                       type: string
                 *                       example: 12345
                 *       400:
                 *         description: Invalid input
                 *         content:
                 *           application/json:
                 *             schema:
                 *               type: object
                 *               properties:
                 *                 success:
                 *                   type: boolean
                 *                   example: false
                 *                 message:
                 *                   type: string
                 *                   example: Invalid request body.
                 *       500:
                 *         description: Internal server error
                 */
                method: "post",
                path: "/",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.brandController.create.bind(this.brandController),
            },
            {
                /**
                 * @swagger
                 * /api/brand/{id}:
                 *   patch:
                 *     tags: [Brand]
                 *     summary: Update an existing brand
                 *     description: Update brand details such as Thai/English names, updatedById, or image.
                 *     parameters:
                 *       - in: path
                 *         name: id
                 *         required: true
                 *         schema:
                 *           type: string
                 *         description: The ID of the brand to update
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         multipart/form-data:
                 *           schema:
                 *             type: object
                 *             properties:
                 *               nameTh:
                 *                 type: string
                 *                 description: Brand name in Thai
                 *                 example: แบรนด์อัปเดต
                 *               nameEn:
                 *                 type: string
                 *                 description: Brand name in English
                 *                 example: Updated Brand
                 *               updatedById:
                 *                 type: string
                 *                 description: ID of the user performing the update
                 *                 example: 12345
                 *               image:
                 *                 type: string
                 *                 format: binary
                 *                 description: Optional new brand image file
                 *     responses:
                 *       200:
                 *         description: Brand updated successfully
                 *         content:
                 *           application/json:
                 *             schema:
                 *               type: object
                 *               properties:
                 *                 success:
                 *                   type: boolean
                 *                   example: true
                 *                 message:
                 *                   type: string
                 *                   example: Brand updated successfully.
                 *                 data:
                 *                   type: object
                 *                   properties:
                 *                     id:
                 *                       type: string
                 *                       example: 67890
                 *                     nameTh:
                 *                       type: string
                 *                       example: แบรนด์อัปเดต
                 *                     nameEn:
                 *                       type: string
                 *                       example: Updated Brand
                 *                     createdById:
                 *                       type: string
                 *                       example: 12345
                 *                     imageUrl:
                 *                       type: string
                 *                       example: https://example.com/image.png
                 *       400:
                 *         description: Invalid input
                 *       404:
                 *         description: Brand not found
                 *       500:
                 *         description: Internal server error
                 */
                method: "patch",
                path: "/:id",
                // middlewares: [AuthMiddleware.authenticateUser],
                handler: this.brandController.update.bind(this.brandController),
            },
            {
                /**
                 * @swagger
                 * /api/brand/bulk:
                 *   post:
                 *     tags: [Brand]
                 *     summary: Bulk upsert brands (create or update many)
                 *     description: For each item, if `id` is provided the brand is updated; if not, a new brand is created. This endpoint accepts JSON only (no file uploads).
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         application/json:
                 *           schema:
                 *             type: object
                 *             required: [items]
                 *             properties:
                 *               items:
                 *                 type: array
                 *                 items:
                 *                   type: object
                 *                   properties:
                 *                     id:
                 *                       type: string
                 *                       description: Existing brand id to update (omit to create)
                 *                       example: "b_123"
                 *                     nameTh:
                 *                       type: string
                 *                       example: แบรนด์เอ
                 *                     nameEn:
                 *                       type: string
                 *                       example: Brand A
                 *                     actorId:
                 *                       type: string
                 *                       description: User id performing the action (used as createdById/updatedById accordingly)
                 *                       example: "u_999"
                 *     responses:
                 *       200:
                 *         description: Bulk upsert result
                 *         content:
                 *           application/json:
                 *             schema:
                 *               type: object
                 *               properties:
                 *                 success:
                 *                   type: boolean
                 *                   example: true
                 *                 message:
                 *                   type: string
                 *                   example: Bulk upsert completed.
                 *                 data:
                 *                   type: object
                 *                   properties:
                 *                     created:
                 *                       type: array
                 *                       items:
                 *                         $ref: '#/components/schemas/Brand'
                 *                     updated:
                 *                       type: array
                 *                       items:
                 *                         $ref: '#/components/schemas/Brand'
                 *                     errors:
                 *                       type: array
                 *                       items:
                 *                         type: object
                 *                         properties:
                 *                           index:
                 *                             type: integer
                 *                             example: 2
                 *                           id:
                 *                             type: string
                 *                             nullable: true
                 *                             example: "b_123"
                 *                           message:
                 *                             type: string
                 *                             example: Brand name already exists
                 *       400:
                 *         description: Invalid request body
                 *       500:
                 *         description: Internal server error
                 */
                method: "post",
                path: "/bulk",
                // middlewares: [AuthMiddleware.authenticateUser],
                handler: this.brandController.bulkUpsert.bind(this.brandController),
            },
            {
                /**
                 * @swagger
                 * /api/brand/{id}/image:
                 *   patch:
                 *     tags: [Brand]
                 *     summary: Replace brand image
                 *     description: Upload and set a new image for the brand. This endpoint accepts multipart/form-data with a single file field named `image`.
                 *     parameters:
                 *       - in: path
                 *         name: id
                 *         required: true
                 *         schema:
                 *           type: string
                 *         description: Brand ID
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         multipart/form-data:
                 *           schema:
                 *             type: object
                 *             required: [image]
                 *             properties:
                 *               image:
                 *                 type: string
                 *                 format: binary
                 *                 description: New brand image file
                 *               actorId:
                 *                 type: string
                 *                 description: ID of the user performing the change (audit)
                 *                 example: "u_999"
                 *     responses:
                 *       200:
                 *         description: Brand image updated
                 *         content:
                 *           application/json:
                 *             schema:
                 *               type: object
                 *               properties:
                 *                 success:
                 *                   type: boolean
                 *                   example: true
                 *                 message:
                 *                   type: string
                 *                   example: Brand image updated successfully.
                 *                 data:
                 *                   type: object
                 *                   properties:
                 *                     id:
                 *                       type: string
                 *                       example: "b_123"
                 *                     imageUrl:
                 *                       type: string
                 *                       example: "https://cdn.example.com/brands/b_123.png"
                 *       400:
                 *         description: Invalid input (e.g., no file provided)
                 *       404:
                 *         description: Brand not found
                 *       415:
                 *         description: Unsupported media type
                 *       500:
                 *         description: Internal server error
                 */
                method: "patch",
                path: "/:id/image",
                // middlewares: [AuthMiddleware.authenticateUser],
                handler: this.brandController.updateImage.bind(this.brandController),
            },
            {
                /**
                 * @swagger
                 * /api/brand/{id}/image:
                 *   delete:
                 *     tags: [Brand]
                 *     summary: Delete brand image
                 *     description: Removes the current/primary image for the brand, clears brand.imageUrl, and deletes the stored file if local.
                 *     parameters:
                 *       - in: path
                 *         name: id
                 *         required: true
                 *         schema:
                 *           type: string
                 *         description: Brand ID
                 *       - in: query
                 *         name: actorId
                 *         required: false
                 *         schema:
                 *           type: string
                 *         description: User ID performing the action (for audit)
                 *     responses:
                 *       200:
                 *         description: Brand image deleted
                 *         content:
                 *           application/json:
                 *             schema:
                 *               type: object
                 *               properties:
                 *                 success:
                 *                   type: boolean
                 *                   example: true
                 *                 message:
                 *                   type: string
                 *                   example: Brand image deleted successfully.
                 *                 data:
                 *                   type: object
                 *                   properties:
                 *                     id:
                 *                       type: string
                 *                       example: "b_123"
                 *                     imageUrl:
                 *                       type: string
                 *                       nullable: true
                 *                       example: null
                 *       404:
                 *         description: Brand not found or no image to delete
                 *       500:
                 *         description: Internal server error
                 */
                method: "delete",
                path: "/:id/image",
                // middlewares: [AuthMiddleware.authenticateUser],
                handler: this.brandController.deleteImage.bind(this.brandController),
            }



        ];
    }
}

export default new BrandRouter().router;
