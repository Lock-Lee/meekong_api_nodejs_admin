import BaseRouter, { RouteConfig } from "./router";
import { BuyerAddressController } from "@controllers/buyerAddress.controller";
import AuthMiddleware from "../middlewares/auth.middleware";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";

class BuyerAddressRouter extends BaseRouter {
  private readonly buyerAddressController: BuyerAddressController;

  constructor() {
    super();
    this.buyerAddressController = container.get<BuyerAddressController>(TYPES.BuyerAddressController);
  }

  protected routes(): RouteConfig[] {
    return [

      {
        /**
     * @swagger
     * /api/buyer-address/getAddress:
     *   get:
     *     tags: [Buyer Address]
     *     summary: Get all addresses for the current user
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: searchText
     *         schema:
     *           type: string
     *         required: true
     *         description: Search text for addresses
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *         required: false
     *         description: Page number
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *         required: false
     *         description: Number of items per page
     *     responses:
     *       200:
     *         description: List of addresses
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   zipcode:
     *                     type: string             
     *                   subdistrict:
     *                     type: string
     *                   district:
     *                     type: string
     *                   province:
     *                     type: string
     *                 
     *       401:
     *         description: Unauthorized
     */
        method: "get",
        path: "/getAddress",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.buyerAddressController.getAddress.bind(this.buyerAddressController),
      },
      {
        /**
         * @swagger
         * components:
         *   schemas:
         *     CreateBuyerAddress:
         *       type: object
         *       properties:
         *         id:
         *           type: string
         *         userId:
         *           type: string
         *         label:
         *           type: string
         *         fullName:
         *           type: string
         *         phone:
         *           type: string
         *         address:
         *           type: string
         *         subDistrict:
         *           type: string
         *         district:
         *           type: string
         *         province:
         *           type: string
         *         postalCode:
         *           type: string
         *         latitude:
         *           type: number
         *         longitude:
         *           type: number
         *         country:
         *           type: string
         *         isDefault:
         *           type: boolean
         *         createdAt:
         *           type: string
         *           format: date-time
         *         updatedAt:
         *           type: string
         *           format: date-time
         * 
         * /api/buyer-address/:
         *   post:
         *     tags: [Buyer Address]
         *     summary: Create a new buyer address
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/CreateBuyerAddress'
         *     parameters:
         *       - in: query
         *         name: userId
         *         schema:
         *           type: string
         *         required: true
         *         description: ID of the user to get addresses for
         *     responses:
         *       201:
         *         description: Address created successfully
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/BuyerAddress'
         *       400:
         *         description: Invalid input data
         *       401:
         *         description: Unauthorized
         */
        method: "post",
        path: "/",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.buyerAddressController.create.bind(this.buyerAddressController),
      },

      {
        /**
         * @swagger
         * /api/buyer-address/:
         *   get:
         *     tags: [Buyer Address]
         *     summary: Get all addresses for the current user
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: query
         *         name: userId
         *         schema:
         *           type: string
         *         required: true
         *         description: ID of the user to get addresses for
         *     responses:
         *       200:
         *         description: List of addresses
         *         content:
         *           application/json:
         *             schema:
         *               type: array
         *               items:
         *                 $ref: '#/components/schemas/BuyerAddress'
         *       401:
         *         description: Unauthorized
         */
        method: "get",
        path: "/",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.buyerAddressController.getAll.bind(this.buyerAddressController),
      },
      {
        /**
         * @swagger
         * /api/buyer-address/{id}:
         *   get:
         *     tags: [Buyer Address]
         *     summary: Get address by ID
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *         description: Address ID
         *     responses:
         *       200:
         *         description: Address details
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/BuyerAddress'
         *       404:
         *         description: Address not found
         *       401:
         *         description: Unauthorized
         */
        method: "get",
        path: "/:id",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.buyerAddressController.getById.bind(this.buyerAddressController),
      },
      {
        /**
         * @swagger
         * components:
         *   schemas:
         *     BuyerAddress:
         *       type: object
         *       properties:
         *         id:
         *           type: string
         *         userId:
         *           type: string
         *         label:
         *           type: string
         *         fullName:
         *           type: string
         *         phone:
         *           type: string
         *         address:
         *           type: string
         *         subDistrict:
         *           type: string
         *         district:
         *           type: string
         *         province:
         *           type: string
         *         postalCode:
         *           type: string
         *         country:
         *           type: string
         *         isDefault:
         *           type: boolean
         *         latitude:
         *           type: number
         *         longitude:
         *           type: number
         *         createdAt:
         *           type: string
         *           format: date-time
         *         updatedAt:
         *           type: string
         *           format: date-time
         * /api/buyer-address/{id}:
         *   put:
         *     tags: [Buyer Address]
         *     summary: Replace an existing address
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *         description: Address ID to replace
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/BuyerAddress'
         *     responses:
         *       200:
         *         description: Address replaced successfully
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/BuyerAddress'
         *       400:
         *         description: Invalid input data
         *       401:
         *         description: Unauthorized
         *       404:
         *         description: Address not found
         */
        method: "put",
        path: "/:id",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.buyerAddressController.update.bind(this.buyerAddressController),
      },
      {
        /**
         * @swagger
         * /api/buyer-address/{id}:
         *   delete:
         *     tags: [Buyer Address]
         *     summary: Delete an address
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *         description: Address ID to delete
         *     responses:
         *       200:
         *         description: Address deleted successfully
         *       401:
         *         description: Unauthorized
         *       404:
         *         description: Address not found
         */
        method: "delete",
        path: "/:id",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.buyerAddressController.delete.bind(this.buyerAddressController),
      },

    ];
  }
}

export default new BuyerAddressRouter().router;
