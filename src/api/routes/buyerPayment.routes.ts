import BaseRouter, { RouteConfig } from "./router";
import { BuyerPaymentController } from "@api/controllers/buyerPayment.controller";
import AuthMiddleware from "../middlewares/auth.middleware";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";

class BuyerPaymentRouter extends BaseRouter {
  private readonly buyerPaymentController: BuyerPaymentController;

  constructor() {
    super();
    this.buyerPaymentController = container.get<BuyerPaymentController>(TYPES.BuyerPaymentController);
  }

  protected routes(): RouteConfig[] {
    return [
      {
        /**
         * @swagger
         * /api/buyer-payment/source:
         *   post:
         *     tags: [Buyer Payment]
         *     summary: Create a new payment source
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               type:
         *                 type: string
         *                 description: The type of the source
         *                 enum: [promptpay, mobile_banking_scb, mobile_banking_bbl, mobile_banking_kbank, mobile_banking_bay, truemoney, alipay]
         *                 example: "promptpay"
         *               amount:
         *                 type: number
         *                 description: The amount for the source (in satang)
         *                 example: 12000
         *               currency:
         *                 type: string
         *                 description: The currency for the source
         *                 example: "THB"
         *               email:
         *                 type: string
         *                 description: The email associated with the source
         *                 example: "test@example.com"
         *             required:
         *               - type
         *               - amount
         *               - currency
         *               - email
         *             example:
         *               type: "promptpay"
         *               amount: 12000
         *               currency: "THB"
         *               email: "test@example.com"
         *     responses:
         *       201:
         *         description: Source created successfully
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 ok:
         *                   type: boolean
         *                   example: true
         *                 message:
         *                   type: string
         *                   example: "Source created successfully."
         *                 data:
         *                   type: object
         *                   properties:
         *                     object:
         *                       type: string
         *                       example: "source"
         *                     id:
         *                       type: string
         *                       example: "src_test_658vf9l3f9f2kiur4hp"
         *                     type:
         *                       type: string
         *                       example: "promptpay"
         *                     amount:
         *                       type: number
         *                       example: 12000
         *                     currency:
         *                       type: string
         *                       example: "THB"
         *                     flow:
         *                       type: string
         *                       example: "offline"
         *       400:
         *         description: Invalid input data
         *       401:
         *         description: Unauthorized
         */
        method: "post",
        path: "/source",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.buyerPaymentController.createSource.bind(this.buyerPaymentController),
      },
      {
        /**
         * @swagger
         * /api/buyer-payment/create:
         *   post:
         *     tags: [Buyer Payment]
         *     summary: Add a new payment item (Create customer and card)
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               userId:
         *                 type: string
         *                 description: The ID of the user
         *                 example: "0198a3eb-57cb-70f9-ab24-b921c25cb590"
         *               email:
         *                 type: string
         *                 description: User email for Omise customer
         *                 example: "test@example.com"
         *               card:
         *                 type: object
         *                 properties:
         *                   name:
         *                     type: string
         *                     description: Name on the card
         *                     example: "Satid Seenun"
         *                   number:
         *                     type: string
         *                     description: Card number (use 4242424242424242 for test)
         *                     example: "4242424242424242"
         *                   expiration_month:
         *                     type: integer
         *                     description: Expiration month of the card
         *                     example: 7
         *                   expiration_year:
         *                     type: integer
         *                     description: Expiration year of the card
         *                     example: 29
         *                   security_code:
         *                     type: string
         *                     description: Security code of the card
         *                     example: "111"
         *                   city:
         *                     type: string
         *                     description: City associated with the card
         *                     example: "Bangkok"
         *                   postal_code:
         *                     type: string
         *                     description: Postal code associated with the card
         *                     example: "11240"
         *                 required:
         *                   - name
         *                   - number
         *                   - expiration_month
         *                   - expiration_year
         *                   - security_code
         *             required:
         *               - userId
         *               - email
         *               - card
         *             example:
         *               userId: "0198a3eb-57cb-70f9-ab24-b921c25cb590"
         *               email: "test@example.com"
         *               card:
         *                 name: "Satid Seenun"
         *                 number: "4242424242424242"
         *                 expiration_month: 7
         *                 expiration_year: 29
         *                 security_code: "111"
         *                 city: "Bangkok"
         *                 postal_code: "11240"
         *     responses:
         *       201:
         *         description: Payment added successfully
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 ok:
         *                   type: boolean
         *                   example: true
         *                 message:
         *                   type: string
         *                   example: "Buyer payment created successfully."
         *                 data:
         *                   type: object
         *                   properties:
         *                     id:
         *                       type: string
         *                       example: "cust_test_658v3isewk0unmjl1jk"
         *                     userId:
         *                       type: string
         *                       example: "0198a3eb-57cb-70f9-ab24-b921c25cb590"
         *                     email:
         *                       type: string
         *                       example: "test@example.com"
         *       400:
         *         description: Invalid input data
         *       401:
         *         description: Unauthorized
         */
        method: "post",
        path: "/create",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.buyerPaymentController.createCard.bind(this.buyerPaymentController),
      },
      {
        /**
         * @swagger
         * /api/buyer-payment/charges:
         *   post:
         *     tags: [Buyer Payment]
         *     summary: Create a new charge for card payment
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               userId:
         *                 type: string
         *                 description: The ID of the user
         *                 example: "0198a3eb-57cb-70f9-ab24-b921c25cb590"
         *               amount:
         *                 type: number
         *                 description: The amount to be charged (in satang)
         *                 example: 10000
         *               currency:
         *                 type: string
         *                 description: The currency of the charge
         *                 example: "THB"
         *               customer:
         *                 type: string
         *                 description: The customer ID from Omise
         *                 example: "cust_test_656ttmrsodhc4tpz9bl"
         *               returnUri:
         *                 type: string
         *                 description: The return URI after the charge
         *                 example: "https://example.com/return"
         *               description:
         *                 type: string
         *                 description: A description for the charge
         *                 example: "Test charge payment"
         *             required:
         *               - userId
         *               - amount
         *               - currency
         *               - customer
         *               - returnUri
         *               - description
         *             example:
         *               userId: "0198a3eb-57cb-70f9-ab24-b921c25cb590"
         *               amount: 10000
         *               currency: "THB"
         *               customer: "cust_test_656ttmrsodhc4tpz9bl"
         *               returnUri: "https://example.com/return"
         *               description: "Test charge payment"
         *     responses:
         *       201:
         *         description: Charge created successfully
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 ok:
         *                   type: boolean
         *                   example: true
         *                 message:
         *                   type: string
         *                   example: "Charge created successfully."
         *                 data:
         *                   type: object
         *                   properties:
         *                     id:
         *                       type: string
         *                       example: "chrg_test_658v57k1o6ronabeq4d"
         *                     amount:
         *                       type: number
         *                       example: 10000
         *                     currency:
         *                       type: string
         *                       example: "THB"
         *                     status:
         *                       type: string
         *                       example: "successful"
         *                     description:
         *                       type: string
         *                       example: "Test charge payment"
         *       400:
         *         description: Invalid input data
         *       401:
         *         description: Unauthorized
         */
        method: "post",
        path: "/charges",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.buyerPaymentController.createCharge.bind(this.buyerPaymentController),
      },
      {
        /**
         * @swagger
         * /api/buyer-payment/cards:
         *   post:
         *     tags: [Buyer Payment]
         *     summary: Get a list of customer cards from Omise
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: query
         *         name: customerId
         *         required: true
         *         schema:
         *           type: string
         *         description: The Omise customer ID
         *         example: "cust_test_656ttmrsodhc4tpz9bl"
         *     responses:
         *       200:
         *         description: List of customer cards retrieved successfully
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 ok:
         *                   type: boolean
         *                   example: true
         *                 message:
         *                   type: string
         *                   example: "Customer card list fetched successfully."
         *                 data:
         *                   type: array
         *                   items:
         *                     type: object
         *                     properties:
         *                       object:
         *                         type: string
         *                         example: "card"
         *                       id:
         *                         type: string
         *                         example: "card_test_656ttmphg5daxmifkp8"
         *                       brand:
         *                         type: string
         *                         example: "Visa"
         *                       last_digits:
         *                         type: string
         *                         example: "4242"
         *                       expiration_month:
         *                         type: number
         *                         example: 12
         *                       expiration_year:
         *                         type: number
         *                         example: 2025
         *                       name:
         *                         type: string
         *                         example: "John Doe"
         *                       city:
         *                         type: string
         *                         example: "Bangkok"
         *                       postal_code:
         *                         type: string
         *                         example: "10110"
         *       400:
         *         description: Invalid input data
         *       401:
         *         description: Unauthorized
         */
        method: "post",
        path: "/cards",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.buyerPaymentController.getCustomerCardList.bind(this.buyerPaymentController),
      },
      {
        /**
         * @swagger
         * /api/buyer-payment/update-card:
         *   post:
         *     tags: [Buyer Payment]
         *     summary: Update an existing customer card
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               customerId:
         *                 type: string
         *                 description: The ID of the customer
         *               cardToken:
         *                 type: string
         *                 description: The token of the new card
         *             required:
         *               - customerId
         *               - cardToken
         *     responses:
         *       200:
         *         description: Card updated successfully
         *       400:
         *         description: Invalid input data
         *       401:
         *         description: Unauthorized
         */
        method: "post",
        path: "/update-card",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.buyerPaymentController.updateCustomerCard.bind(this.buyerPaymentController),
      },
      {
        /**
         * @swagger
         * /api/buyer-payment/promptpay:
         *   post:
         *     tags: [Buyer Payment]
         *     summary: Create PromptPay payment with QR Code
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               amount:
         *                 type: number
         *                 description: Amount in satang (1 baht = 100 satang)
         *                 example: 10000
         *               currency:
         *                 type: string
         *                 description: Currency code
         *                 example: "THB"
         *               returnUri:
         *                 type: string
         *                 description: Return URL after payment
         *                 example: "https://example.com/return"
         *               description:
         *                 type: string
         *                 description: Payment description
         *                 example: "Test PromptPay payment"
         *             required:
         *               - amount
         *               - currency
         *               - returnUri
         *               - description
         *             example:
         *               amount: 10000
         *               currency: "THB"
         *               returnUri: "https://example.com/return"
         *               description: "Test PromptPay payment"
         *     responses:
         *       201:
         *         description: PromptPay payment created successfully
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 ok:
         *                   type: boolean
         *                   example: true
         *                 message:
         *                   type: string
         *                   example: "PromptPay payment created successfully."
         *                 data:
         *                   type: object
         *                   properties:
         *                     id:
         *                       type: string
         *                       example: "chrg_test_658v5eqxcvp9cy2xqo5"
         *                     amount:
         *                       type: number
         *                       example: 10000
         *                     currency:
         *                       type: string
         *                       example: "THB"
         *                     status:
         *                       type: string
         *                       example: "pending"
         *                     description:
         *                       type: string
         *                       example: "Test PromptPay payment"
         *                     source:
         *                       type: object
         *                       properties:
         *                         id:
         *                           type: string
         *                           example: "src_test_658v5epds8jtorcjar1"
         *                         type:
         *                           type: string
         *                           example: "promptpay"
         *                         scannable_code:
         *                           type: object
         *                           description: QR Code information for PromptPay
         *                           properties:
         *                             object:
         *                               type: string
         *                               example: "barcode"
         *                             type:
         *                               type: string
         *                               example: "qr"
         *                             image:
         *                               type: object
         *                               properties:
         *                                 download_uri:
         *                                   type: string
         *                                   example: "https://api.omise.co/charges/chrg_test_658v5eqxcvp9cy2xqo5/documents/docu_test_658v5es9k3teq27mb0j/downloads/CCB947BB8EE4F1F8"
         *       400:
         *         description: Invalid input data
         *       401:
         *         description: Unauthorized
         */
        method: "post",
        path: "/promptpay",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.buyerPaymentController.createPromptPayPayment.bind(this.buyerPaymentController),
      },
      {
        /**
         * @swagger
         * /api/buyer-payment/mobile-banking:
         *   post:
         *     tags: [Buyer Payment]
         *     summary: Create Mobile Banking payment
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               amount:
         *                 type: number
         *                 description: Amount in satang (1 baht = 100 satang)
         *                 example: 15000
         *               currency:
         *                 type: string
         *                 description: Currency code
         *                 example: "THB"
         *               returnUri:
         *                 type: string
         *                 description: Return URL after payment
         *                 example: "https://example.com/return"
         *               description:
         *                 type: string
         *                 description: Payment description
         *                 example: "Test Mobile Banking payment"
         *               platformType:
         *                 type: string
         *                 description: Bank platform type
         *                 enum: [scb, bay, ktb, bbl, kbank, ttb, gsb, uob]
         *                 example: "scb"
         *             required:
         *               - amount
         *               - currency
         *               - returnUri
         *               - description
         *               - platformType
         *             example:
         *               amount: 15000
         *               currency: "THB"
         *               returnUri: "https://example.com/return"
         *               description: "Test Mobile Banking payment"
         *               platformType: "scb"
         *     responses:
         *       201:
         *         description: Mobile Banking payment created successfully
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 ok:
         *                   type: boolean
         *                   example: true
         *                 message:
         *                   type: string
         *                   example: "Mobile Banking payment created successfully."
         *                 data:
         *                   type: object
         *                   properties:
         *                     id:
         *                       type: string
         *                       example: "chrg_test_658verdy3me1ax42kul"
         *                     amount:
         *                       type: number
         *                       example: 15000
         *                     currency:
         *                       type: string
         *                       example: "THB"
         *                     status:
         *                       type: string
         *                       example: "pending"
         *                     description:
         *                       type: string
         *                       example: "Test Mobile Banking payment"
         *                     source:
         *                       type: object
         *                       properties:
         *                         id:
         *                           type: string
         *                           example: "src_test_658verbusxfcy5lva7a"
         *                         type:
         *                           type: string
         *                           example: "mobile_banking_scb"
         *       400:
         *         description: Invalid input data
         *       401:
         *         description: Unauthorized
         */
        method: "post",
        path: "/mobile-banking",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.buyerPaymentController.createMobileBankingPayment.bind(this.buyerPaymentController),
      },
      {
        /**
         * @swagger
         * /api/buyer-payment/pay:
         *   post:
         *     tags: [Buyer Payment]
         *     summary: Create payment by type (Universal payment method)
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               paymentType:
         *                 type: string
         *                 description: Payment method type
         *                 enum: [card, promptpay, mobile_banking]
         *                 example: "promptpay"
         *               amount:
         *                 type: number
         *                 description: Amount in satang (1 baht = 100 satang)
         *                 example: 10000
         *               currency:
         *                 type: string
         *                 description: Currency code
         *                 example: "THB"
         *               returnUri:
         *                 type: string
         *                 description: Return URL after payment
         *                 example: "https://your-app.com/payment/return"
         *               description:
         *                 type: string
         *                 description: Payment description
         *                 example: "Payment for Order #12345"
         *               customer:
         *                 type: string
         *                 description: Customer ID (required for card payments)
         *                 example: "cust_123456789"
         *               options:
         *                 type: object
         *                 properties:
         *                   platformType:
         *                     type: string
         *                     description: Bank platform type (required for mobile banking)
         *                     enum: [scb, bay, ktb, bbl, kbank, ttb, gsb, uob]
         *                     example: "scb"
         *             required:
         *               - paymentType
         *               - amount
         *               - currency
         *               - returnUri
         *               - description
         *     responses:
         *       201:
         *         description: Payment created successfully
         *       400:
         *         description: Invalid input data
         *       401:
         *         description: Unauthorized
         */
        method: "post",
        path: "/pay",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.buyerPaymentController.createPaymentByType.bind(this.buyerPaymentController),
      },
      {
        /**
         * @swagger
         * /api/buyer-payment/user/{userId}/cards:
         *   get:
         *     tags: [Buyer Payment]
         *     summary: Get all cards for a user from database
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: userId
         *         required: true
         *         schema:
         *           type: string
         *         description: The ID of the user
         *         example: "0198a3eb-57cb-70f9-ab24-b921c25cb590"
         *     responses:
         *       200:
         *         description: User cards retrieved successfully
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 ok:
         *                   type: boolean
         *                   example: true
         *                 message:
         *                   type: string
         *                   example: "Cards fetched successfully."
         *                 data:
         *                   type: array
         *                   items:
         *                     type: object
         *                     properties:
         *                       id:
         *                         type: string
         *                         example: "card_test_658v428u0e84l3502xj"
         *                       financeProfileId:
         *                         type: string
         *                         example: "cust_test_656ttmrsodhc4tpz9bl"
         *                       brand:
         *                         type: string
         *                         example: "VISA"
         *                       lastDigits:
         *                         type: string
         *                         example: "4242"
         *                       expirationMonth:
         *                         type: number
         *                         example: 7
         *                       expirationYear:
         *                         type: number
         *                         example: 2029
         *                       createdAt:
         *                         type: string
         *                         example: "2025-10-02T14:46:11.732Z"
         *                       financeProfile:
         *                         type: object
         *                         properties:
         *                           id:
         *                             type: string
         *                             example: "cust_test_656ttmrsodhc4tpz9bl"
         *                           userId:
         *                             type: string
         *                             example: "0198a3eb-57cb-70f9-ab24-b921c25cb590"
         *       400:
         *         description: Invalid input data
         *       401:
         *         description: Unauthorized
         */
        method: "get",
        path: "/user/:userId/cards",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.buyerPaymentController.getCardsByUserId.bind(this.buyerPaymentController),
      },
      {
        /**
         * @swagger
         * /api/buyer-payment/finance-profile/{financeProfileId}/cards:
         *   get:
         *     tags: [Buyer Payment]
         *     summary: Get all cards for a finance profile
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: financeProfileId
         *         required: true
         *         schema:
         *           type: string
         *         description: The ID of the finance profile
         *     responses:
         *       200:
         *         description: Finance profile cards retrieved successfully
         *         content:
         *           application/json:
         *             schema:
         *               type: array
         *               items:
         *                 type: object
         *                 properties:
         *                   id:
         *                     type: string
         *                   brand:
         *                     type: string
         *                   lastDigits:
         *                     type: string
         *                   expirationMonth:
         *                     type: number
         *                   expirationYear:
         *                     type: number
         *       400:
         *         description: Invalid input data
         *       401:
         *         description: Unauthorized
         */
        method: "get",
        path: "/finance-profile/:financeProfileId/cards",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.buyerPaymentController.getCardsByFinanceProfileId.bind(this.buyerPaymentController),
      },
      {
        /**
         * @swagger
         * /api/buyer-payment/card/{cardId}:
         *   get:
         *     tags: [Buyer Payment]
         *     summary: Get a specific card by ID
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: cardId
         *         required: true
         *         schema:
         *           type: string
         *         description: The ID of the card
         *     responses:
         *       200:
         *         description: Card retrieved successfully
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 id:
         *                   type: string
         *                 brand:
         *                   type: string
         *                 lastDigits:
         *                   type: string
         *                 expirationMonth:
         *                   type: number
         *                 expirationYear:
         *                   type: number
         *                 financeProfile:
         *                   type: object
         *                   properties:
         *                     id:
         *                       type: string
         *                     userId:
         *                       type: string
         *       400:
         *         description: Invalid input data
         *       401:
         *         description: Unauthorized
         *       404:
         *         description: Card not found
         */
        method: "get",
        path: "/card/:cardId",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.buyerPaymentController.getCardById.bind(this.buyerPaymentController),
      },
      {
        /**
         * @swagger
         * /api/buyer-payment/user/{userId}/has-cards:
         *   get:
         *     tags: [Buyer Payment]
         *     summary: Check if user has cards
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: userId
         *         required: true
         *         schema:
         *           type: string
         *         description: The ID of the user
         *     responses:
         *       200:
         *         description: Card check completed successfully
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 hasCards:
         *                   type: boolean
         *                   description: Whether the user has cards or not
         *       400:
         *         description: Invalid input data
         *       401:
         *         description: Unauthorized
         */
        method: "get",
        path: "/user/:userId/has-cards",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.buyerPaymentController.hasCards.bind(this.buyerPaymentController),
      },
      {
        /**
         * @swagger
         * /api/buyer-payment/capability:
         *   get:
         *     tags: [Buyer Payment]
         *     summary: Get Omise payment capability and supported payment methods
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: Capability retrieved successfully
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 ok:
         *                   type: boolean
         *                   example: true
         *                 message:
         *                   type: string
         *                   example: "Capability retrieved successfully."
         *                 data:
         *                   type: object
         *                   properties:
         *                     object:
         *                       type: string
         *                       example: "capability"
         *                     location:
         *                       type: string
         *                       example: "/capability"
         *                     banks:
         *                       type: array
         *                       items:
         *                         type: string
         *                       example: ["test", "bbl", "kbank", "scb", "bay", "ktb", "ttb", "gsb", "uob"]
         *                     limits:
         *                       type: object
         *                       properties:
         *                         charge_amount:
         *                           type: object
         *                           properties:
         *                             max:
         *                               type: number
         *                               example: 15000000
         *                             min:
         *                               type: number
         *                               example: 2000
         *                         transfer_amount:
         *                           type: object
         *                           properties:
         *                             max:
         *                               type: number
         *                               example: 200000000000
         *                             min:
         *                               type: number
         *                               example: 3000
         *                         installment_amount:
         *                           type: object
         *                           properties:
         *                             min:
         *                               type: number
         *                               example: 200000
         *                     payment_methods:
         *                       type: array
         *                       items:
         *                         type: object
         *                         properties:
         *                           object:
         *                             type: string
         *                             example: "payment_method"
         *                           name:
         *                             type: string
         *                             example: "promptpay"
         *                           currencies:
         *                             type: array
         *                             items:
         *                               type: string
         *                             example: ["THB"]
         *                           card_brands:
         *                             type: array
         *                             items:
         *                               type: string
         *                             nullable: true
         *                             example: null
         *                           installment_terms:
         *                             type: array
         *                             items:
         *                               type: number
         *                             nullable: true
         *                             example: null
         *                           banks:
         *                             type: array
         *                             items:
         *                               type: string
         *                             example: []
         *                     country:
         *                       type: string
         *                       example: "TH"
         *                     tokenization_methods:
         *                       type: array
         *                       items:
         *                         type: string
         *                       example: ["googlepay", "applepay"]
         *                     zero_interest_installments:
         *                       type: boolean
         *                       example: false
         *       400:
         *         description: Invalid request
         *       401:
         *         description: Unauthorized
         *       500:
         *         description: Failed to retrieve capability
         */
        method: "get",
        path: "/capability",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: this.buyerPaymentController.getCapability.bind(this.buyerPaymentController),
      },
    ];
  }
}

export default new BuyerPaymentRouter().router;
