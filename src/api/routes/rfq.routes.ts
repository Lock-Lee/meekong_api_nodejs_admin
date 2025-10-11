import BaseRouter, { RouteConfig } from "./router";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import AuthMiddleware from "../middlewares/auth.middleware";
import { RFQController } from "../controllers/rfq.controller";

class RFQRouter extends BaseRouter {
    private readonly rfqController: RFQController;

    constructor() {
        super();
        this.rfqController = container.get<RFQController>(TYPES.RFQController);
    }

    protected routes(): RouteConfig[] {
        return [
            {
                /**
                 * @swagger
                 * /api/rfq:
                 *   post:
                 *     tags: [RFQ]
                 *     summary: Create a new RFQ (Request for Quotation)
                 *     security:
                 *       - bearerAuth: []
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         application/json:
                 *           schema:
                 *             type: object
                 *             required:
                 *               - nameTh
                 *               - nameEn
                 *               - description
                 *               - itemType
                 *               - quantity
                 *             properties:
                 *               nameTh:
                 *                 type: string
                 *                 description: Thai name of the requested item
                 *               nameEn:
                 *                 type: string
                 *                 description: English name of the requested item
                 *               description:
                 *                 type: string
                 *                 description: Detailed description of requirements
                 *               itemType:
                 *                 type: string
                 *                 enum: [NEW, USED]
                 *                 description: Type of item requested
                 *               minBudget:
                 *                 type: number
                 *                 minimum: 0
                 *                 description: Minimum budget range
                 *               maxBudget:
                 *                 type: number
                 *                 minimum: 0
                 *                 description: Maximum budget range
                 *               quantity:
                 *                 type: integer
                 *                 minimum: 1
                 *                 description: Quantity required
                 *               categoryId:
                 *                 type: string
                 *                 format: uuid
                 *                 description: Category ID
                 *               brandId:
                 *                 type: string
                 *                 format: uuid
                 *                 description: Brand ID
                 *               expireAt:
                 *                 type: string
                 *                 format: date-time
                 *                 description: RFQ expiration date
                 *               imageUrl:
                 *                 type: string
                 *                 format: uri
                 *                 description: Main image URL
                 *               images:
                 *                 type: array
                 *                 items:
                 *                   type: string
                 *                   format: uri
                 *                 description: Additional image URLs
                 *               sizes:
                 *                 type: array
                 *                 items:
                 *                   type: object
                 *                   properties:
                 *                     sizeUnitId:
                 *                       type: string
                 *                       format: uuid
                 *                     value:
                 *                       type: string
                 *     responses:
                 *       201:
                 *         description: RFQ created successfully
                 *       400:
                 *         description: Invalid request data
                 *       401:
                 *         description: Authentication required
                 */
                method: "post",
                path: "/",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.rfqController.createRFQ.bind(this.rfqController),
            },
            {
                /**
                 * @swagger
                 * /api/rfq/{id}:
                 *   get:
                 *     tags: [RFQ]
                 *     summary: Get RFQ by ID
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: id
                 *         required: true
                 *         schema:
                 *           type: string
                 *           format: uuid
                 *         description: RFQ ID
                 *     responses:
                 *       200:
                 *         description: RFQ retrieved successfully
                 *       404:
                 *         description: RFQ not found
                 *       401:
                 *         description: Authentication required
                 */
                method: "get",
                path: "/:id",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.rfqController.getRFQ.bind(this.rfqController),
            },
            {
                /**
                 * @swagger
                 * /api/rfq:
                 *   get:
                 *     tags: [RFQ]
                 *     summary: Search RFQs with filters
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: query
                 *         name: page
                 *         schema:
                 *           type: integer
                 *           minimum: 1
                 *           default: 1
                 *         description: Page number
                 *       - in: query
                 *         name: pageSize
                 *         schema:
                 *           type: integer
                 *           minimum: 1
                 *           maximum: 100
                 *           default: 20
                 *         description: Items per page
                 *       - in: query
                 *         name: status
                 *         schema:
                 *           type: string
                 *           enum: [OPEN, CLOSED, EXPIRED, CANCELLED]
                 *         description: RFQ status
                 *       - in: query
                 *         name: categoryId
                 *         schema:
                 *           type: string
                 *           format: uuid
                 *         description: Filter by category
                 *       - in: query
                 *         name: brandId
                 *         schema:
                 *           type: string
                 *           format: uuid
                 *         description: Filter by brand
                 *       - in: query
                 *         name: requesterId
                 *         schema:
                 *           type: string
                 *           format: uuid
                 *         description: Filter by requester
                 *       - in: query
                 *         name: minBudget
                 *         schema:
                 *           type: number
                 *           minimum: 0
                 *         description: Minimum budget filter
                 *       - in: query
                 *         name: maxBudget
                 *         schema:
                 *           type: number
                 *           minimum: 0
                 *         description: Maximum budget filter
                 *       - in: query
                 *         name: itemType
                 *         schema:
                 *           type: string
                 *           enum: [NEW, USED]
                 *         description: Item type filter
                 *       - in: query
                 *         name: search
                 *         schema:
                 *           type: string
                 *         description: Search in names and description
                 *     responses:
                 *       200:
                 *         description: RFQs retrieved successfully
                 *       400:
                 *         description: Invalid query parameters
                 *       401:
                 *         description: Authentication required
                 */
                method: "get",
                path: "/",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.rfqController.searchRFQs.bind(this.rfqController),
            },
            {
                /**
                 * @swagger
                 * /api/rfq/{id}:
                 *   put:
                 *     tags: [RFQ]
                 *     summary: Update RFQ
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: id
                 *         required: true
                 *         schema:
                 *           type: string
                 *           format: uuid
                 *         description: RFQ ID
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         application/json:
                 *           schema:
                 *             type: object
                 *             properties:
                 *               nameTh:
                 *                 type: string
                 *               nameEn:
                 *                 type: string
                 *               description:
                 *                 type: string
                 *               itemType:
                 *                 type: string
                 *                 enum: [NEW, USED]
                 *               minBudget:
                 *                 type: number
                 *                 minimum: 0
                 *               maxBudget:
                 *                 type: number
                 *                 minimum: 0
                 *               quantity:
                 *                 type: integer
                 *                 minimum: 1
                 *               categoryId:
                 *                 type: string
                 *                 format: uuid
                 *               brandId:
                 *                 type: string
                 *                 format: uuid
                 *               status:
                 *                 type: string
                 *                 enum: [OPEN, CLOSED, EXPIRED, CANCELLED]
                 *               expireAt:
                 *                 type: string
                 *                 format: date-time
                 *               imageUrl:
                 *                 type: string
                 *                 format: uri
                 *               images:
                 *                 type: array
                 *                 items:
                 *                   type: string
                 *                   format: uri
                 *               sizes:
                 *                 type: array
                 *                 items:
                 *                   type: object
                 *                   properties:
                 *                     sizeUnitId:
                 *                       type: string
                 *                       format: uuid
                 *                     value:
                 *                       type: string
                 *     responses:
                 *       200:
                 *         description: RFQ updated successfully
                 *       400:
                 *         description: Invalid request data
                 *       401:
                 *         description: Authentication required
                 *       404:
                 *         description: RFQ not found
                 */
                method: "put",
                path: "/:id",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.rfqController.updateRFQ.bind(this.rfqController),
            },
            {
                /**
                 * @swagger
                 * /api/rfq/{id}:
                 *   delete:
                 *     tags: [RFQ]
                 *     summary: Delete RFQ
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: id
                 *         required: true
                 *         schema:
                 *           type: string
                 *           format: uuid
                 *         description: RFQ ID
                 *     responses:
                 *       200:
                 *         description: RFQ deleted successfully
                 *       401:
                 *         description: Authentication required
                 *       404:
                 *         description: RFQ not found
                 *       400:
                 *         description: Cannot delete RFQ with existing orders
                 */
                method: "delete",
                path: "/:id",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.rfqController.deleteRFQ.bind(this.rfqController),
            },
            {
                /**
                 * @swagger
                 * /api/rfq/my/requests:
                 *   get:
                 *     tags: [RFQ]
                 *     summary: Get my RFQ requests
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: query
                 *         name: page
                 *         schema:
                 *           type: integer
                 *           minimum: 1
                 *           default: 1
                 *         description: Page number
                 *     responses:
                 *       200:
                 *         description: My RFQ requests retrieved successfully
                 *       401:
                 *         description: Authentication required
                 */
                method: "get",
                path: "/my/requests",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.rfqController.getMyRFQs.bind(this.rfqController),
            },
            {
                /**
                 * @swagger
                 * /api/rfq/{rfqId}/quotations:
                 *   post:
                 *     tags: [RFQ]
                 *     summary: Submit a quotation for an RFQ
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: rfqId
                 *         required: true
                 *         schema:
                 *           type: string
                 *           format: uuid
                 *         description: RFQ ID
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         application/json:
                 *           schema:
                 *             type: object
                 *             required:
                 *               - itemPrice
                 *             properties:
                 *               itemPrice:
                 *                 type: number
                 *                 minimum: 0.01
                 *                 description: Price per item
                 *               itemId:
                 *                 type: string
                 *                 format: uuid
                 *                 description: Existing item ID (if applicable)
                 *               itemVariantId:
                 *                 type: string
                 *                 format: uuid
                 *                 description: Existing item variant ID (if applicable)
                 *               productName:
                 *                 type: string
                 *                 description: Product name (for custom products)
                 *               productDescription:
                 *                 type: string
                 *                 description: Product description (for custom products)
                 *               productImages:
                 *                 type: string
                 *                 description: JSON string of product image URLs
                 *               expireAt:
                 *                 type: string
                 *                 format: date-time
                 *                 description: Quotation expiration date
                 *     responses:
                 *       201:
                 *         description: Quotation submitted successfully
                 *       400:
                 *         description: Invalid request data or quotation already exists
                 *       401:
                 *         description: Authentication required
                 *       404:
                 *         description: RFQ not found
                 */
                method: "post",
                path: "/:rfqId/quotations",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.rfqController.submitQuotation.bind(this.rfqController),
            },
            {
                /**
                 * @swagger
                 * /api/rfq/{rfqId}/quotations:
                 *   get:
                 *     tags: [RFQ]
                 *     summary: Get quotations for an RFQ
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: rfqId
                 *         required: true
                 *         schema:
                 *           type: string
                 *           format: uuid
                 *         description: RFQ ID
                 *     responses:
                 *       200:
                 *         description: Quotations retrieved successfully
                 *       401:
                 *         description: Authentication required
                 *       404:
                 *         description: RFQ not found
                 */
                method: "get",
                path: "/:rfqId/quotations",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.rfqController.getQuotations.bind(this.rfqController),
            },
            {
                /**
                 * @swagger
                 * /api/rfq/{rfqId}/quotations/{quotationId}/order:
                 *   post:
                 *     tags: [RFQ]
                 *     summary: Create order from selected quotation
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: rfqId
                 *         required: true
                 *         schema:
                 *           type: string
                 *           format: uuid
                 *         description: RFQ ID
                 *       - in: path
                 *         name: quotationId
                 *         required: true
                 *         schema:
                 *           type: string
                 *           format: uuid
                 *         description: Selected quotation ID
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         application/json:
                 *           schema:
                 *             type: object
                 *             required:
                 *               - quantity
                 *               - unitPrice
                 *               - subtotal
                 *               - totalAmount
                 *             properties:
                 *               quantity:
                 *                 type: integer
                 *                 minimum: 1
                 *                 description: Order quantity
                 *               unitPrice:
                 *                 type: number
                 *                 minimum: 0.01
                 *                 description: Price per unit
                 *               subtotal:
                 *                 type: number
                 *                 minimum: 0.01
                 *                 description: Subtotal amount
                 *               shippingCost:
                 *                 type: number
                 *                 minimum: 0
                 *                 description: Shipping cost
                 *               commissionRate:
                 *                 type: number
                 *                 minimum: 0
                 *                 maximum: 100
                 *                 description: Commission rate percentage
                 *               commissionFee:
                 *                 type: number
                 *                 minimum: 0
                 *                 description: Commission fee amount
                 *               totalAmount:
                 *                 type: number
                 *                 minimum: 0.01
                 *                 description: Total order amount
                 *               itemId:
                 *                 type: string
                 *                 format: uuid
                 *                 description: Item ID (if applicable)
                 *               itemVariantId:
                 *                 type: string
                 *                 format: uuid
                 *                 description: Item variant ID (if applicable)
                 *               productName:
                 *                 type: string
                 *                 description: Product name
                 *               productDescription:
                 *                 type: string
                 *                 description: Product description
                 *               productImages:
                 *                 type: string
                 *                 description: JSON string of product images
                 *               specialConditions:
                 *                 type: string
                 *                 description: Special conditions for the order
                 *     responses:
                 *       201:
                 *         description: Order created successfully
                 *       400:
                 *         description: Invalid request data
                 *       401:
                 *         description: Authentication required
                 *       404:
                 *         description: RFQ or quotation not found
                 */
                method: "post",
                path: "/:rfqId/quotations/:quotationId/order",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.rfqController.createOrder.bind(this.rfqController),
            },
            {
                /**
                 * @swagger
                 * /api/rfq/my/orders:
                 *   get:
                 *     tags: [RFQ]
                 *     summary: Get my RFQ orders
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: query
                 *         name: type
                 *         required: true
                 *         schema:
                 *           type: string
                 *           enum: [buyer, seller]
                 *         description: Order type (as buyer or seller)
                 *     responses:
                 *       200:
                 *         description: My RFQ orders retrieved successfully
                 *       400:
                 *         description: Invalid type parameter
                 *       401:
                 *         description: Authentication required
                 */
                method: "get",
                path: "/my/orders",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.rfqController.getMyOrders.bind(this.rfqController),
            },
            {
                /**
                 * @swagger
                 * /api/rfq/orders/{orderId}:
                 *   get:
                 *     tags: [RFQ]
                 *     summary: Get RFQ order by ID
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: orderId
                 *         required: true
                 *         schema:
                 *           type: string
                 *           format: uuid
                 *         description: Order ID
                 *     responses:
                 *       200:
                 *         description: Order retrieved successfully
                 *       401:
                 *         description: Authentication required
                 *       404:
                 *         description: Order not found
                 */
                method: "get",
                path: "/orders/:orderId",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.rfqController.getOrder.bind(this.rfqController),
            },
        ];
    }
}

export default new RFQRouter().router;