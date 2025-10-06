import { Request, Response } from "express";
import Send from "@utils/response.utils";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import { Logger } from "../../shared/utils/logger";
import { IBuyerCheckoutService } from "../../business/interfaces/buyer-checkout.interfaces";


export class BuyerCheckoutController {
  private buyerCheckoutService: IBuyerCheckoutService;
  constructor() {
    this.buyerCheckoutService = container.get<IBuyerCheckoutService>(TYPES.BuyerCheckoutService);
  }
  async checkout(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Processing checkout", { requestId: req.id });

      const checkoutResult = await this.buyerCheckoutService.checkout({
        buyerId: req.body.buyerId,
        shopId: req.body.shopId,
        items: req.body.items,
        addressId: req.body.addressId,
        paymentMethod: req.body.paymentMethod,
        totalAmount: req.body.totalAmount,
        userId: req.body.userId,
        subtotal: req.body.subtotal,
        shippingCost: req.body.shippingCost,
        commissionFee: req.body.commissionFee,
        shippingAddress: req.body.shippingAddress
      });

      Logger.info("Checkout processed successfully", {
        orderId: checkoutResult.orderId,
        requestId: req.id
      });

      return Send.success(res, checkoutResult, "Checkout processed successfully.");
    } catch (error) {
      Logger.error("Failed to process checkout", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

  async updateOrderStatusToPaid(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;

      Logger.info("Updating order status to PAID", {
        orderId,
        requestId: req.id
      });

      const result = await this.buyerCheckoutService.updateOrderStatusToPaid(orderId);

      Logger.info("Order status updated successfully", {
        orderId: result.orderId,
        status: result.status,
        requestId: req.id
      });

      return Send.success(res, result, "Order status updated to PAID successfully.");
    } catch (error) {
      Logger.error("Failed to update order status", {
        orderId: req.params.orderId,
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }
}