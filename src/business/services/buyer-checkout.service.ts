import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { ValidationError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";
import {
    CheckoutRequest,
    CheckoutResult,
    IBuyerCheckoutService,
    IBuyerCheckoutRepository,
    UpdateOrderStatusResult
} from "../interfaces/buyer-checkout.interfaces";

@injectable()
export class BuyerCheckoutService implements IBuyerCheckoutService {
    constructor(
        @inject(TYPES.BuyerCheckoutRepository) private buyerCheckoutRepository: IBuyerCheckoutRepository
    ) { }
    checkout(data: CheckoutRequest): Promise<CheckoutResult> {
        Logger.info("Processing checkout", { data });
        if (!data) {
            throw new ValidationError("Checkout data is required");
        }
        return this.buyerCheckoutRepository.checkout(data);
    }

    async updateOrderStatusToPaid(orderId: string): Promise<UpdateOrderStatusResult> {
        Logger.info("Updating order status to PAID", { orderId });

        if (!orderId) {
            throw new ValidationError("Order ID is required");
        }

        return this.buyerCheckoutRepository.updateOrderStatus({
            orderId,
            status: "PAID"
        });
    }
}
