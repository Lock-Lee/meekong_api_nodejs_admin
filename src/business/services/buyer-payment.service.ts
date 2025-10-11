import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { IBuyerPaymentService, IBuyerPaymentRepository, CreateBuyerPaymentData, BuyerPaymentData, ChargeResponse, CreateChargeData, ICardList, CreateSourceData, SourceResponse, ICard, CapabilityResponse } from "@business/interfaces/buyer-payment.interfaces";


@injectable()
export class BuyerPaymentService implements IBuyerPaymentService {
    constructor(
        @inject(TYPES.BuyerPaymentRepository) private buyerPaymentRepository: IBuyerPaymentRepository
    ) { }
    createSource(data: CreateSourceData): Promise<SourceResponse> {
        return this.buyerPaymentRepository.createSource(data);
    }
    async getCustomerCardList(customerId: string): Promise<ICardList[]> {
        return await this.buyerPaymentRepository.getCustomerCardList(customerId);
    }

    async getCardsByUserId(userId: string): Promise<ICard[]> {
        return await this.buyerPaymentRepository.getCardsByUserId(userId);
    }

    async getCardsByFinanceProfileId(financeProfileId: string): Promise<ICard[]> {
        return await this.buyerPaymentRepository.getCardsByFinanceProfileId(financeProfileId);
    }

    async getCardById(cardId: string): Promise<ICard> {
        return await this.buyerPaymentRepository.getCardById(cardId);
    }

    async hasCards(userId: string): Promise<boolean> {
        return await this.buyerPaymentRepository.hasCards(userId);
    }

    async updateCustomerCard(customerId: string, cardToken: string): Promise<void> {
        return await this.buyerPaymentRepository.updateCustomerCard(customerId, cardToken);
    }

    async createCharge(data: CreateChargeData): Promise<ChargeResponse> {
        return await this.buyerPaymentRepository.createCharge(data);
    }

    async createToken(data: CreateBuyerPaymentData): Promise<BuyerPaymentData> {
        return await this.buyerPaymentRepository.createToken(data);
    }

    async createPromptPayPayment(data: CreateChargeData): Promise<ChargeResponse> {
        return await this.buyerPaymentRepository.createPromptPayPayment(data);
    }

    async createMobileBankingPayment(data: CreateChargeData, platformType: string): Promise<ChargeResponse> {
        return await this.buyerPaymentRepository.createMobileBankingPayment(data, platformType);
    }

    async createPaymentByType(paymentType: string, data: CreateChargeData, options?: { platformType?: string }): Promise<ChargeResponse> {
        return await this.buyerPaymentRepository.createPaymentByType(paymentType, data, options);
    }

    async getCapability(): Promise<CapabilityResponse> {
        return await this.buyerPaymentRepository.getCapability();
    }

    async refundCharge(chargeId: string, amount?: number): Promise<import("@business/interfaces/buyer-payment.interfaces").RefundResponse> {
        return await this.buyerPaymentRepository.refundCharge(chargeId, amount);
    }
}
