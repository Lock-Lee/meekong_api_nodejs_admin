import BaseRouter, { RouteConfig } from "../router";
import { container } from "../../../main/inversify.config";
import { TYPES } from "@shared/types/service.types";
import AuthMiddleware from "@api/middlewares/auth.middleware";
import ItemControllerV2 from "@api/controllers/v2/item.controller.v2";

class ItemV2Router extends BaseRouter {
    private readonly controller: ItemControllerV2;

    constructor() {
        super();
        this.controller = container.get<ItemControllerV2>(TYPES.ItemControllerV2);
    }

    protected routes(): RouteConfig[] {
        return [
            {
                /**
                 * @swagger
                 * /api/v2/items/{id}:
                 *   get:
                 *     summary: Get item by ID (V2)
                 *     tags: [Items V2]
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: id
                 *         required: true
                 *         schema:
                 *           type: string
                 *           format: uuid
                 *         description: Item ID
                 *     responses:
                 *       200:
                 *         description: Item retrieved successfully
                 *       404:
                 *         description: Item not found
                 *       401:
                 *         description: Authentication required
                 */
                method: "get",
                path: "/:id",
                handler: this.controller.getById.bind(this.controller)
            },
            {
                /**
                 * @swagger
                 * /api/v2/items:
                 *   post:
                 *     summary: Create item (V2 - JSON only, no media)
                 *     tags: [Items V2]
                 *     security:
                 *       - bearerAuth: []
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         application/json:
                 *           schema:
                 *             type: object
                 *             required:
                 *               - code
                 *               - brandId
                 *               - categoryId
                 *               - nameTh
                 *               - nameEn
                 *               - descriptionTh
                 *               - descriptionEn
                 *               - itemType
                 *               - sellType
                 *               - itemVariants
                 *             properties:
                 *               code:
                 *                 type: string
                 *                 description: Unique item code
                 *               brandId:
                 *                 type: string
                 *                 format: uuid
                 *               categoryId:
                 *                 type: string
                 *                 format: uuid
                 *               nameTh:
                 *                 type: string
                 *               nameEn:
                 *                 type: string
                 *               descriptionTh:
                 *                 type: string
                 *               descriptionEn:
                 *                 type: string
                 *               itemType:
                 *                 type: string
                 *                 enum: [NEW, USED]
                 *               sellType:
                 *                 type: string
                 *                 enum: [NORMAL, AUCTION, SATISFY, RFQ]
                 *               itemVariants:
                 *                 type: array
                 *                 items:
                 *                   type: object
                 *                   required:
                 *                     - variantName
                 *                     - price
                 *                   properties:
                 *                     variantName:
                 *                       type: string
                 *                     price:
                 *                       type: number
                 *                     stockQuantity:
                 *                       type: number
                 *                       default: 0
                 *     responses:
                 *       201:
                 *         description: Item created successfully
                 *       400:
                 *         description: Invalid request data
                 *       401:
                 *         description: Authentication required
                 */
                method: "post",
                path: "/",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.controller.create.bind(this.controller)
            },
            {
                /**
                 * @swagger
                 * /api/v2/items/{id}:
                 *   put:
                 *     summary: Update item (V2 - JSON only)
                 *     tags: [Items V2]
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: id
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
                 *             properties:
                 *               code:
                 *                 type: string
                 *               nameTh:
                 *                 type: string
                 *               nameEn:
                 *                 type: string
                 *               descriptionTh:
                 *                 type: string
                 *               descriptionEn:
                 *                 type: string
                 *     responses:
                 *       200:
                 *         description: Item updated successfully
                 *       400:
                 *         description: Invalid request data
                 *       401:
                 *         description: Authentication required
                 *       404:
                 *         description: Item not found
                 */
                method: "put",
                path: "/:id",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.controller.update.bind(this.controller)
            },
            {
                /**
                 * @swagger
                 * /api/v2/items/{id}:
                 *   delete:
                 *     summary: Delete item (V2)
                 *     tags: [Items V2]
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: id
                 *         required: true
                 *         schema:
                 *           type: string
                 *           format: uuid
                 *         description: Item ID
                 *     responses:
                 *       200:
                 *         description: Item deleted successfully
                 *       401:
                 *         description: Authentication required
                 *       404:
                 *         description: Item not found
                 */
                method: "delete",
                path: "/:id",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.controller.delete.bind(this.controller)
            },
        ];
    }
}

export default new ItemV2Router().router;


