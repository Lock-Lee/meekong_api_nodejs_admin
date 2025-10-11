import BaseRouter, { RouteConfig } from "./router";
import ItemController from "../controllers/item.controller";
import AuthMiddleware from "../middlewares/auth.middleware";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";

class ItemRouter extends BaseRouter {
  private readonly itemController: ItemController;

  constructor() {
    super();
    this.itemController = container.get<ItemController>(TYPES.ItemController);
  }

  protected routes(): RouteConfig[] {
    return [
      {
        /**
         * @swagger
         * /api/item/:
         *   get:
         *     tags: [Item]
         *     summary: Get all items
         *     responses:
         *       200:
         *         description: Successful operation
         */
        method: "get",
        path: "/",
        handler: this.itemController.getAll.bind(this.itemController),
      },
      {
        /**
         * @swagger
         * /api/item/dropdown:
         *   get:
         *     tags: [Item]
         *     summary: Get all items
         *     responses:
         *       200:
         *         description: Successful operation
         */
        method: "get",
        path: "/dropdown",
        handler: this.itemController.getAlldropdown.bind(this.itemController),
      },
      {
        /**
         * @swagger
         * /api/item/search:
         *   get:
         *     tags: [Item]
         *     summary: Search for items
         *     parameters:
         *       - in: query
         *         name: q
         *         schema:
         *           type: string
         *         description: Search query
         *     responses:
         *       200:
         *         description: Successful operation
         */
        method: "get",
        path: "/search",
        handler: this.itemController.search.bind(this.itemController),
      },
      {
        /**
         * @swagger
         * /api/item/{id}:
         *   get:
         *     tags: [Item]
         *     summary: Get item by ID
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *         description: Item ID
         *     responses:
         *       200:
         *         description: Successful operation
         *       404:
         *         description: Item not found
         */
        method: "get",
        path: "/:id",
        handler: this.itemController.getById.bind(this.itemController),
      },
      {
        /**
         * @swagger
         * /api/item/suggestions:
         *   get:
         *     tags: [Item]
         *     summary: Get search suggestions
         *     parameters:
         *       - in: query
         *         name: query
         *         required: true
         *         schema:
         *           type: string
         *         description: Search keyword for suggestions
         *       - in: query
         *         name: limit
         *         schema:
         *           type: integer
         *           format: int32
         *           default: 5
         *         description: Maximum number of suggestions to return
         *     responses:
         *       200:
         *         description: Successful operation
         */
        method: "get",
        path: "/suggestions",
        handler: this.itemController.suggestions.bind(this.itemController),
      },
      {
        /**
         * @swagger
         * /api/item/:
         *   post:
         *     tags: [Item]
         *     summary: Create a new item
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         multipart/form-data:
         *           schema:
         *             type: object
         *             properties:
         *               brandId:
         *                 type: string
         *                 format: uuid
         *                 description: Brand UUID
         *               categoryId:
         *                 type: string
         *                 format: uuid
         *                 description: Category UUID
         *               nameTh:
         *                 type: string
         *                 description: Thai name
         *               nameEn:
         *                 type: string
         *                 description: English name
         *               descriptionTh:
         *                 type: string
         *                 description: Thai description
         *               descriptionEn:
         *                 type: string
         *                 description: English description
         *               tags:
         *                 type: array
         *                 items:
         *                   type: string
         *                 maxItems: 3
         *                 description: Array of tags (max 3)
         *               shippingDuration:
         *                 type: integer
         *                 minimum: 1
         *                 maximum: 30
         *                 description: Shipping duration in days
         *               itemType:
         *                 type: string
         *                 enum: [NEW, USED]
         *               sellType:
         *                 type: string
         *                 enum: [NORMAL, AUCTION, SATISFY, RFQ]
         *               itemVariants:
         *                 type: string
         *                 description: JSON string of item variants
         *               images:
         *                 type: array
         *                 items:
         *                   type: string
         *                   format: binary
         *     responses:
         *       201:
         *         description: Item created successfully
         *       400:
         *         description: Invalid input
         *       401:
         *         description: Unauthorized
         */
        method: "post",
        path: "/",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.itemController.create.bind(this.itemController),
      },
      {
        /**
         * @swagger
         * /api/item/{id}:
         *   put:
         *     tags: [Item]
         *     summary: Update an existing item
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
         *         multipart/form-data:
         *           schema:
         *             type: object
         *             properties:
         *               brandId:
         *                 type: string
         *                 format: uuid
         *                 description: Brand UUID
         *               categoryId:
         *                 type: string
         *                 format: uuid
         *                 description: Category UUID
         *               nameTh:
         *                 type: string
         *                 description: Thai name
         *               nameEn:
         *                 type: string
         *                 description: English name
         *               descriptionTh:
         *                 type: string
         *                 description: Thai description
         *               descriptionEn:
         *                 type: string
         *                 description: English description
         *               tags:
         *                 type: array
         *                 items:
         *                   type: string
         *                 maxItems: 3
         *                 description: Array of tags (max 3) - differential update
         *               shippingDuration:
         *                 type: integer
         *                 minimum: 1
         *                 maximum: 30
         *                 description: Shipping duration in days
         *               itemType:
         *                 type: string
         *                 enum: [NEW, USED]
         *               sellType:
         *                 type: string
         *                 enum: [NORMAL, AUCTION, SATISFY, RFQ]
         *               itemVariants:
         *                 type: string
         *                 description: JSON string of item variants
         *               images:
         *                 type: array
         *                 items:
         *                   type: string
         *                   format: binary
         *                 description: New images to add (optional)
         *     responses:
         *       200:
         *         description: Item updated successfully
         *       400:
         *         description: Invalid input
         *       401:
         *         description: Unauthorized
         *       403:
         *         description: Permission denied (can only update own items)
         *       404:
         *         description: Item not found
         */
        method: "put",
        path: "/:id",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.itemController.update.bind(this.itemController),
      },
      {
        /**
  * @swagger
  * /api/item/{itemId}:
  *   delete:
  *     tags: [Item]
  *     summary: Delete item
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
  *       - in: query
  *         name: status
  *         required: true
  *         schema:
  *           type: string
  *           enum: [INACTIVE, DELETED]
  *         description: Item status
  *     responses:
  *       200:
  *         description: Item deleted successfully
  *       401:
  *         description: Unauthorized
  *       403:
  *         description: Permission denied (can only delete own items)
  *       404:
  *         description: Item not found
  */
        method: "delete",
        path: "/:itemId",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.itemController.delete.bind(this.itemController),
      },
      {
        /**
         * @swagger
         * /api/item/variant/{itemId}:
         *   put:
         *     tags: [Item]
         *     summary: Update item variant (price and stock)
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
         *     example:
         *       itemId: "00f80e50-3ddd-45a2-9256-1a3f73bc857f" 
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               nameTh:
         *                 type: string
         *                 description: Thai item name
         *               nameEn:
         *                 type: string
         *                 description: English item name
         *               itemVariants:
         *                 type: array
         *                 items:
         *                   type: object
         *                   properties:
         *                     variantId:
         *                       type: string
         *                     price:
         *                       type: number
         *                       minimum: 0.01
         *                     stockQuantity:
         *                       type: integer
         *                       minimum: 0
         *             example:
         *               nameTh: "รถจำลอง"
         *               nameEn: "Model car"
         *               itemVariants:
         *                 - variantId: "00f80e50-3ddd-45a2-9256-1a3f73bc857f"
         *                   price: 4500
         *                   stockQuantity: 150
         *     responses:
         *       200:
         *         description: Item variant updated successfully
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
         *                   example: "Item variant updated successfully."
         *                 data:
         *                   type: object
         *                   properties:
         *                     variantId:
         *                       type: string
         *                     nameTh:
         *                       type: string
         *                     nameEn:
         *                       type: string
         *                     itemVariants:
         *                       type: array
         *                       items:
         *                         type: object
         *                         properties:
         *                           variantId:
         *                             type: string
         *                           price:
         *                             type: number
         *                           stockQuantity:
         *                             type: integer
         *       400:
         *         description: Invalid input
         *       401:
         *         description: Unauthorized
         *       403:
         *         description: Permission denied (can only update own items)
         *       404:
         *         description: Item or variant not found
         */
        method: "put",
        path: "/variant/:itemId",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.itemController.updateVariant.bind(this.itemController),
      },
      {
        /**
         * @swagger
         * /api/item/variant-auction/{itemId}:
        *   put:
        *     tags: [Item]
        *     summary: Update auction item (variant stock and auction fields)
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
         *     example:
         *       itemId: "00f80e50-3ddd-45a2-9256-1a3f73bc857f" 
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               nameTh:
         *                 type: string
         *                 description: Thai item name
         *               nameEn:
         *                 type: string
         *                 description: English item name
         *               itemVariants:
        *                 type: array
        *                 items:
        *                   type: object
        *                   properties:
        *                     variantId:
        *                       type: string
        *                     stockQuantity:
        *                       type: integer
        *                       minimum: 0
        *               itemAuction:
        *                 type: array
        *                 items:
        *                   type: object
        *                   properties:
        *                     auctionId:
        *                       type: string
        *                     startPrice:
        *                       type: number
        *                       minimum: 0.01
        *                     buyNowPrice:
        *                       type: number
        *                       minimum: 0.01
        *                     startAt:
        *                       type: string
        *                       format: date-time
        *                     endAt:
        *                       type: string
        *                       format: date-time
        *             example:
        *               nameTh: "รถจำลอง"
        *               nameEn: "Model car"
        *               itemVariants:
        *                 - variantId: "00f80e50-3ddd-45a2-9256-1a3f73bc857f"
        *                   stockQuantity: 150
        *               itemAuction:
        *                 - auctionId: "4a7b23c9-1234-5678-90ab-1c2d3e4f5a6b"
        *                   startPrice: 4500
        *                   buyNowPrice: 5000
        *                   startAt: "2025-09-25T23:41:23.000Z"
        *                   endAt: "2025-09-26T23:41:23.000Z"
         *     responses:
         *       200:
         *         description: Item variant updated successfully
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
         *                   example: "Item variant updated successfully."
         *                 data:
        *                   type: object
        *                   properties:
        *                     itemId:
        *                       type: string
        *                     userId:
        *                       type: string
        *                     nameTh:
        *                       type: string
        *                     nameEn:
        *                       type: string
        *                     itemVariants:
        *                       type: array
        *                       items:
        *                         type: object
        *                         properties:
        *                           variantId:
        *                             type: string
        *                           stockQuantity:
        *                             type: integer
        *                     itemAuction:
        *                       type: array
        *                       items:
        *                         type: object
        *                         properties:
        *                           auctionId:
        *                             type: string 
        *                           startPrice:
        *                             type: number
        *                           buyNowPrice:
        *                             type: number
        *                           startAt:
        *                             type: string
        *                             format: date-time
        *                           endAt:
        *                             type: string
        *                             format: date-time

         *       400:
         *         description: Invalid input
         *       401:
         *         description: Unauthorized
         *       403:
         *         description: Permission denied (can only update own items)
         *       404:
         *         description: Item or variant not found
         */
        method: "put",
        path: "/variant-auction/:itemId",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.itemController.updateVariantAuctionItem.bind(this.itemController),
      },


    ];
  }
}

export default new ItemRouter().router;
