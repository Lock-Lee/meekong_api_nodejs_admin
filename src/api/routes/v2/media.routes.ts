import BaseRouter, { RouteConfig } from "../router";
import { container } from "../../../main/inversify.config";
import { TYPES } from "@shared/types/service.types";
import AuthMiddleware from "@api/middlewares/auth.middleware";
import MediaController from "@api/controllers/v2/media.controller";

class MediaRouter extends BaseRouter {
    private readonly controller: MediaController;

    constructor() {
        super();
        this.controller = container.get<MediaController>(TYPES.MediaController);
    }

    protected routes(): RouteConfig[] {
        return [
            {
                /**
                 * @swagger
                 * /api/v2/media/items/{itemId}:
                 *   get:
                 *     summary: List media for an item (V2)
                 *     tags: [Media V2]
                 *     parameters:
                 *       - in: path
                 *         name: itemId
                 *         required: true
                 *         schema:
                 *           type: string
                 *           format: uuid
                 *         description: Item ID
                 *     responses:
                 *       200:
                 *         description: Media retrieved successfully
                 */
                method: "get",
                path: "/items/:itemId",
                handler: this.controller.listItemMedia.bind(this.controller)
            },
            {
                /**
                 * @swagger
                 * /api/v2/media/presign:
                 *   post:
                 *     summary: Get presigned upload URL (V2)
                 *     tags: [Media V2]
                 *     security:
                 *       - bearerAuth: []
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         application/json:
                 *           schema:
                 *             type: object
                 *             required: [itemId, type, contentType, fileName, size]
                 *             properties:
                 *               itemId:
                 *                 type: string
                 *                 format: uuid
                 *               type:
                 *                 type: string
                 *                 enum: [IMAGE, VIDEO]
                 *               contentType:
                 *                 type: string
                 *               fileName:
                 *                 type: string
                 *               size:
                 *                 type: number
                 *               multipart:
                 *                 type: boolean
                 *                 description: Use multipart upload for large files
                 *     responses:
                 *       200:
                 *         description: Presigned URL generated
                 */
                method: "post",
                path: "/presign",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.controller.presign.bind(this.controller)
            },
            {
                /**
                 * @swagger
                 * /api/v2/media/complete:
                 *   post:
                 *     summary: Complete media upload (V2)
                 *     tags: [Media V2]
                 *     security:
                 *       - bearerAuth: []
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         application/json:
                 *           schema:
                 *             type: object
                 *             required: [itemId, type, key]
                 *             properties:
                 *               itemId:
                 *                 type: string
                 *                 format: uuid
                 *               type:
                 *                 type: string
                 *                 enum: [IMAGE, VIDEO]
                 *               key:
                 *                 type: string
                 *               size:
                 *                 type: number
                 *               contentType:
                 *                 type: string
                 *               uploadId:
                 *                 type: string
                 *               parts:
                 *                 type: array
                 *                 items:
                 *                   type: object
                 *                   required: [partNumber, etag]
                 *                   properties:
                 *                     partNumber:
                 *                       type: number
                 *                     etag:
                 *                       type: string
                 *     responses:
                 *       200:
                 *         description: Upload completed
                 */
                method: "post",
                path: "/complete",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.controller.complete.bind(this.controller)
            },
            {
                /**
                 * @swagger
                 * /api/v2/media/{mediaId}:
                 *   delete:
                 *     summary: Delete media (V2)
                 *     tags: [Media V2]
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: mediaId
                 *         required: true
                 *         schema:
                 *           type: string
                 *           format: uuid
                 *         description: Media ID
                 *     responses:
                 *       200:
                 *         description: Media deleted
                 */
                method: "delete",
                path: "/:mediaId",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.controller.delete.bind(this.controller)
            },
            {
                /**
                 * @swagger
                 * /api/v2/media/items/{itemId}/order:
                 *   patch:
                 *     summary: Set primary image for item (V2)
                 *     tags: [Media V2]
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: itemId
                 *         required: true
                 *         schema:
                 *           type: string
                 *           format: uuid
                 *         description: Item ID
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         application/json:
                 *           schema:
                 *             type: object
                 *             required: [primaryImageId]
                 *             properties:
                 *               primaryImageId:
                 *                 type: string
                 *                 format: uuid
                 *     responses:
                 *       200:
                 *         description: Primary image updated
                 */
                method: "patch",
                path: "/items/:itemId/order",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.controller.reorder.bind(this.controller)
            },
        ];
    }
}

export default new MediaRouter().router;


