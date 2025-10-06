import { Request, Response } from "express";
import { injectable } from "inversify";
import Send from "@utils/response.utils";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import { Logger } from "../../shared/utils/logger";
import { IBuyerPaymentService } from "../../business/interfaces/buyer-payment.interfaces";


@injectable()
export class BuyerPaymentController {
  private buyerPaymentService: IBuyerPaymentService;

  constructor() {
    this.buyerPaymentService = container.get<IBuyerPaymentService>(TYPES.BuyerPaymentService);
  }

  async createSource(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Creating source", { requestId: req.id });
      const source = await this.buyerPaymentService.createSource(req.body);

      Logger.info("Source created successfully", {
        sourceId: source.id,
        requestId: req.id
      });

      return Send.success(res, source, "Source created successfully.");
    } catch (error) {
      Logger.error("Failed to create source", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

  async createCard(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Creating buyer payment", { requestId: req.id });
      const buyerPayment = await this.buyerPaymentService.createToken(req.body);

      Logger.info("Buyer payment created successfully", {
        buyerPaymentId: buyerPayment.id,
        requestId: req.id
      });

      return Send.success(res, buyerPayment, "Buyer payment created successfully.");
    } catch (error) {
      Logger.error("Failed to fetch buyer favorites", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

  async createCharge(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Creating charge", { requestId: req.id });
      const charge = await this.buyerPaymentService.createCharge(req.body);

      Logger.info("Charge created successfully", {
        chargeId: charge.id,
        requestId: req.id
      });

      return Send.success(res, charge, "Charge created successfully.");
    } catch (error) {
      Logger.error("Failed to create charge", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }
  async getCustomerCardList(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Fetching customer card list", { requestId: req.id });
      const cardList = await this.buyerPaymentService.getCustomerCardList(req.query.customerId as string);

      Logger.info("Customer card list retrieved successfully", {
        requestId: req.id
      });

      return Send.success(res, cardList, "Customer card list fetched successfully.");
    } catch (error) {
      Logger.error("Failed to fetch customer card list", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

  async getCardsByUserId(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Fetching cards by user ID", { requestId: req.id });
      const cards = await this.buyerPaymentService.getCardsByUserId(req.params.userId);

      Logger.info("Cards retrieved successfully", {
        cardCount: cards.length,
        requestId: req.id
      });

      return Send.success(res, cards, "Cards fetched successfully.");
    } catch (error) {
      Logger.error("Failed to fetch cards by user ID", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

  async getCardsByFinanceProfileId(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Fetching cards by finance profile ID", { requestId: req.id });
      const cards = await this.buyerPaymentService.getCardsByFinanceProfileId(req.params.financeProfileId);

      Logger.info("Cards retrieved successfully", {
        cardCount: cards.length,
        requestId: req.id
      });

      return Send.success(res, cards, "Cards fetched successfully.");
    } catch (error) {
      Logger.error("Failed to fetch cards by finance profile ID", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

  async getCardById(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Fetching card by ID", { requestId: req.id });
      const card = await this.buyerPaymentService.getCardById(req.params.cardId);

      Logger.info("Card retrieved successfully", {
        cardId: card.id,
        requestId: req.id
      });

      return Send.success(res, card, "Card fetched successfully.");
    } catch (error) {
      Logger.error("Failed to fetch card by ID", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

  async hasCards(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Checking if user has cards", { requestId: req.id });
      const hasCards = await this.buyerPaymentService.hasCards(req.params.userId);

      Logger.info("Card check completed", {
        userId: req.params.userId,
        hasCards: hasCards,
        requestId: req.id
      });

      return Send.success(res, { hasCards }, "Card check completed successfully.");
    } catch (error) {
      Logger.error("Failed to check if user has cards", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }
  async updateCustomerCard(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Updating customer card", { requestId: req.id });
      await this.buyerPaymentService.updateCustomerCard(req.body.customerId, req.body.cardToken);

      Logger.info("Customer card updated successfully", {
        requestId: req.id
      });

      return Send.success(res, null, "Customer card updated successfully.");
    } catch (error) {
      Logger.error("Failed to update customer card", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

  async createPromptPayPayment(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Creating PromptPay payment", { requestId: req.id });
      const payment = await this.buyerPaymentService.createPromptPayPayment(req.body);

      Logger.info("PromptPay payment created successfully", {
        paymentId: payment.id,
        requestId: req.id
      });

      return Send.success(res, payment, "PromptPay payment created successfully.");
    } catch (error) {
      Logger.error("Failed to create PromptPay payment", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

  async createMobileBankingPayment(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Creating Mobile Banking payment", { requestId: req.id });
      const { platformType, ...paymentData } = req.body;
      const payment = await this.buyerPaymentService.createMobileBankingPayment(paymentData, platformType);

      Logger.info("Mobile Banking payment created successfully", {
        paymentId: payment.id,
        platformType: platformType,
        requestId: req.id
      });

      return Send.success(res, payment, "Mobile Banking payment created successfully.");
    } catch (error) {
      Logger.error("Failed to create Mobile Banking payment", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

  async createPaymentByType(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Creating payment by type", { requestId: req.id });
      const { paymentType, options, ...paymentData } = req.body;
      const payment = await this.buyerPaymentService.createPaymentByType(paymentType, paymentData, options);

      Logger.info("Payment created successfully", {
        paymentId: payment.id,
        paymentType: paymentType,
        requestId: req.id
      });

      return Send.success(res, payment, `${paymentType} payment created successfully.`);
    } catch (error) {
      Logger.error("Failed to create payment", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

  async getCapability(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Fetching Omise capability", { requestId: req.id });
      const capability = await this.buyerPaymentService.getCapability();

      Logger.info("Capability retrieved successfully", {
        requestId: req.id,
        paymentMethodsCount: capability.payment_methods.length,
        country: capability.country
      });

      return Send.success(res, capability, "Capability retrieved successfully.");
    } catch (error) {
      Logger.error("Failed to fetch capability", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }
}
