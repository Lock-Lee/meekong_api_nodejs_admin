import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import {
    IRFQService,
    IRFQRepository,
    RFQData,
    CreateRFQRequest,
    UpdateRFQRequest,
    SearchRFQRequest,
    RFQListResult,
    CreateQuotationRequest,
    QuotationData,
    CreateRFQOrderRequest,
    RFQOrderData
} from "../interfaces/rfq.interfaces";
import { RFQStatus, RFQQuotation, RFQOrder } from "../../../generated/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { Logger } from "../../shared/utils/logger";
import { BusinessError } from "../../shared/errors/business.errors";

@injectable()
export class RFQService implements IRFQService {
    constructor(
        @inject(TYPES.RFQRepository) private rfqRepository: IRFQRepository
    ) { }

    // RFQ CRUD Methods
    async createRFQ(request: CreateRFQRequest): Promise<RFQData> {
        Logger.info("Creating RFQ", { request });

        try {
            // Validate request
            if (!request.nameTh || !request.nameEn) {
                throw new BusinessError("Name in Thai and English are required", 400);
            }

            if (!request.description) {
                throw new BusinessError("Description is required", 400);
            }

            if (request.quantity <= 0) {
                throw new BusinessError("Quantity must be greater than 0", 400);
            }

            // Create RFQ data
            const rfqData = {
                nameTh: request.nameTh,
                nameEn: request.nameEn,
                description: request.description,
                itemType: request.itemType,
                minBudget: request.minBudget || new Decimal(0),
                maxBudget: request.maxBudget || new Decimal(0),
                quantity: request.quantity,
                categoryId: request.categoryId || null,
                brandId: request.brandId || null,
                requesterId: request.requesterId,
                status: RFQStatus.OPEN,
                expireAt: request.expireAt || null,
                imageUrl: request.imageUrl || null,
            };

            // Create RFQ
            const rfq = await this.rfqRepository.createRFQ(rfqData);

            // Add images if provided
            if (request.images && request.images.length > 0) {
                await this.rfqRepository.addRFQImages(rfq.id, request.images);
            }

            // Add sizes if provided
            if (request.sizes && request.sizes.length > 0) {
                await this.rfqRepository.addRFQSizes(rfq.id, request.sizes);
            }

            // Fetch complete RFQ with relations
            const completeRFQ = await this.rfqRepository.findRFQById(rfq.id);
            if (!completeRFQ) {
                throw new BusinessError("Failed to create RFQ", 500);
            }

            return completeRFQ;
        } catch (error) {
            Logger.error("Error creating RFQ", error);
            if (error instanceof BusinessError) {
                throw error;
            }
            throw new BusinessError("Failed to create RFQ", 500);
        }
    }

    async getRFQById(id: string): Promise<RFQData | null> {
        Logger.info("Getting RFQ by ID", { id });

        try {
            const rfq = await this.rfqRepository.findRFQById(id);
            return rfq;
        } catch (error) {
            Logger.error("Error getting RFQ by ID", error);
            throw new BusinessError("Failed to get RFQ", 500);
        }
    }

    async searchRFQs(request: SearchRFQRequest): Promise<RFQListResult> {
        Logger.info("Searching RFQs", { request });

        try {
            const pageSize = Math.min(request.pageSize || 20, 100); // Max 100 items per page
            const page = Math.max(request.page || 1, 1);

            const searchRequest = {
                ...request,
                page,
                pageSize
            };

            const { rfqs, total } = await this.rfqRepository.findRFQs(searchRequest);
            const totalPages = Math.ceil(total / pageSize);

            return {
                rfqs,
                total,
                page,
                pageSize,
                totalPages
            };
        } catch (error) {
            Logger.error("Error searching RFQs", error);
            throw new BusinessError("Failed to search RFQs", 500);
        }
    }

    async updateRFQ(id: string, request: UpdateRFQRequest): Promise<RFQData> {
        Logger.info("Updating RFQ", { id, request });

        try {
            // Check if RFQ exists
            const existingRFQ = await this.rfqRepository.findRFQById(id);
            if (!existingRFQ) {
                throw new BusinessError("RFQ not found", 404);
            }

            // Create update data without images and sizes
            const updateData = {
                nameTh: request.nameTh,
                nameEn: request.nameEn,
                description: request.description,
                itemType: request.itemType,
                minBudget: request.minBudget,
                maxBudget: request.maxBudget,
                quantity: request.quantity,
                categoryId: request.categoryId,
                brandId: request.brandId,
                status: request.status,
                expireAt: request.expireAt,
                imageUrl: request.imageUrl,
            };

            // Update RFQ
            await this.rfqRepository.updateRFQ(id, updateData);

            // Update images if provided
            if (request.images) {
                await this.rfqRepository.removeRFQImages(id);
                if (request.images.length > 0) {
                    await this.rfqRepository.addRFQImages(id, request.images);
                }
            }

            // Update sizes if provided
            if (request.sizes) {
                await this.rfqRepository.updateRFQSizes(id, request.sizes);
            }

            // Return updated RFQ with relations
            const completeRFQ = await this.rfqRepository.findRFQById(id);
            if (!completeRFQ) {
                throw new BusinessError("Failed to update RFQ", 500);
            }

            return completeRFQ;
        } catch (error) {
            Logger.error("Error updating RFQ", error);
            if (error instanceof BusinessError) {
                throw error;
            }
            throw new BusinessError("Failed to update RFQ", 500);
        }
    }

    async deleteRFQ(id: string): Promise<void> {
        Logger.info("Deleting RFQ", { id });

        try {
            const existingRFQ = await this.rfqRepository.findRFQById(id);
            if (!existingRFQ) {
                throw new BusinessError("RFQ not found", 404);
            }

            // Check if RFQ has orders
            if (existingRFQ.orders && existingRFQ.orders.length > 0) {
                throw new BusinessError("Cannot delete RFQ with existing orders", 400);
            }

            await this.rfqRepository.deleteRFQ(id);
        } catch (error) {
            Logger.error("Error deleting RFQ", error);
            if (error instanceof BusinessError) {
                throw error;
            }
            throw new BusinessError("Failed to delete RFQ", 500);
        }
    }

    async getMyRFQs(requesterId: string, page: number = 1): Promise<RFQListResult> {
        Logger.info("Getting my RFQs", { requesterId, page });

        try {
            const searchRequest: SearchRFQRequest = {
                requesterId,
                page,
                pageSize: 20
            };

            return this.searchRFQs(searchRequest);
        } catch (error) {
            Logger.error("Error getting my RFQs", error);
            throw new BusinessError("Failed to get your RFQs", 500);
        }
    }

    // Quotation Methods
    async submitQuotation(request: CreateQuotationRequest): Promise<QuotationData> {
        Logger.info("Submitting quotation", { request });

        try {
            // Validate request
            if (request.itemPrice.lte(0)) {
                throw new BusinessError("Price must be greater than 0", 400);
            }

            // Check if RFQ exists and is open
            const rfq = await this.rfqRepository.findRFQById(request.rfqId);
            if (!rfq) {
                throw new BusinessError("RFQ not found", 404);
            }

            if (rfq.status !== RFQStatus.OPEN) {
                throw new BusinessError("RFQ is not open for quotations", 400);
            }

            // Check if seller already submitted a quotation
            const existingQuotations = await this.rfqRepository.findQuotationsByRFQ(request.rfqId);
            const sellerQuotation = existingQuotations.find(q => q.sellerId === request.sellerId);

            if (sellerQuotation) {
                throw new BusinessError("You have already submitted a quotation for this RFQ", 400);
            }

            // Create quotation
            const quotationData = {
                rfqId: request.rfqId,
                sellerId: request.sellerId,
                itemPrice: request.itemPrice,
                itemId: request.itemId || null,
                itemVariantId: request.itemVariantId || null,
                productName: request.productName || null,
                productDescription: request.productDescription || null,
                productImages: request.productImages || null,
                status: "PENDING" as const,
                expireAt: request.expireAt || null,
            };

            const quotation = await this.rfqRepository.createQuotation(quotationData);
            return quotation;
        } catch (error) {
            Logger.error("Error submitting quotation", error);
            if (error instanceof BusinessError) {
                throw error;
            }
            throw new BusinessError("Failed to submit quotation", 500);
        }
    }

    async getQuotationsForRFQ(rfqId: string): Promise<QuotationData[]> {
        Logger.info("Getting quotations for RFQ", { rfqId });

        try {
            const quotations = await this.rfqRepository.findQuotationsByRFQ(rfqId);
            return quotations;
        } catch (error) {
            Logger.error("Error getting quotations for RFQ", error);
            throw new BusinessError("Failed to get quotations", 500);
        }
    }

    async getMyQuotations(sellerId: string): Promise<QuotationData[]> {
        Logger.info("Getting my quotations", { sellerId });

        try {
            // This would need a new repository method
            // For now, we'll implement basic functionality
            throw new BusinessError("Not implemented yet", 501);
        } catch (error) {
            Logger.error("Error getting my quotations", error);
            throw new BusinessError("Failed to get your quotations", 500);
        }
    }

    async updateQuotation(id: string, data: Partial<RFQQuotation>): Promise<QuotationData> {
        Logger.info("Updating quotation", { id, data });

        try {
            const existingQuotation = await this.rfqRepository.findQuotationById(id);
            if (!existingQuotation) {
                throw new BusinessError("Quotation not found", 404);
            }

            const updatedQuotation = await this.rfqRepository.updateQuotation(id, data);
            return updatedQuotation;
        } catch (error) {
            Logger.error("Error updating quotation", error);
            if (error instanceof BusinessError) {
                throw error;
            }
            throw new BusinessError("Failed to update quotation", 500);
        }
    }

    async deleteQuotation(id: string): Promise<void> {
        Logger.info("Deleting quotation", { id });

        try {
            const existingQuotation = await this.rfqRepository.findQuotationById(id);
            if (!existingQuotation) {
                throw new BusinessError("Quotation not found", 404);
            }

            await this.rfqRepository.deleteQuotation(id);
        } catch (error) {
            Logger.error("Error deleting quotation", error);
            if (error instanceof BusinessError) {
                throw error;
            }
            throw new BusinessError("Failed to delete quotation", 500);
        }
    }

    // Order Methods
    async createOrderFromQuotation(request: CreateRFQOrderRequest): Promise<RFQOrderData> {
        Logger.info("Creating order from quotation", { request });

        try {
            // Validate quotation exists
            const quotation = await this.rfqRepository.findQuotationById(request.quotationId);
            if (!quotation) {
                throw new BusinessError("Quotation not found", 404);
            }

            // Validate RFQ exists
            const rfq = await this.rfqRepository.findRFQById(request.rfqId);
            if (!rfq) {
                throw new BusinessError("RFQ not found", 404);
            }

            // Create order data
            const orderData = {
                rfqId: request.rfqId,
                quotationId: request.quotationId,
                buyerId: request.buyerId,
                sellerId: request.sellerId,
                quantity: request.quantity,
                unitPrice: request.unitPrice,
                subtotal: request.subtotal,
                shippingCost: request.shippingCost || new Decimal(0),
                commissionRate: request.commissionRate || new Decimal(0),
                commissionFee: request.commissionFee || new Decimal(0),
                totalAmount: request.totalAmount,
                itemId: request.itemId || null,
                itemVariantId: request.itemVariantId || null,
                productName: request.productName || null,
                productDescription: request.productDescription || null,
                productImages: request.productImages || null,
                specialConditions: request.specialConditions || null,
                status: "PENDING" as const,
            };

            const order = await this.rfqRepository.createRFQOrder(orderData);
            return order;
        } catch (error) {
            Logger.error("Error creating order from quotation", error);
            if (error instanceof BusinessError) {
                throw error;
            }
            throw new BusinessError("Failed to create order", 500);
        }
    }

    async getMyRFQOrders(userId: string, type: 'buyer' | 'seller'): Promise<RFQOrderData[]> {
        Logger.info("Getting my RFQ orders", { userId, type });

        try {
            if (type === 'buyer') {
                return this.rfqRepository.findRFQOrdersByBuyer(userId);
            } else {
                return this.rfqRepository.findRFQOrdersBySeller(userId);
            }
        } catch (error) {
            Logger.error("Error getting my RFQ orders", error);
            throw new BusinessError("Failed to get your orders", 500);
        }
    }

    async getRFQOrderById(id: string): Promise<RFQOrderData | null> {
        Logger.info("Getting RFQ order by ID", { id });

        try {
            const order = await this.rfqRepository.findRFQOrderById(id);
            return order;
        } catch (error) {
            Logger.error("Error getting RFQ order by ID", error);
            throw new BusinessError("Failed to get order", 500);
        }
    }

    async updateRFQOrder(id: string, data: Partial<RFQOrder>): Promise<RFQOrderData> {
        Logger.info("Updating RFQ order", { id, data });

        try {
            const existingOrder = await this.rfqRepository.findRFQOrderById(id);
            if (!existingOrder) {
                throw new BusinessError("Order not found", 404);
            }

            const updatedOrder = await this.rfqRepository.updateRFQOrder(id, data);
            return updatedOrder;
        } catch (error) {
            Logger.error("Error updating RFQ order", error);
            if (error instanceof BusinessError) {
                throw error;
            }
            throw new BusinessError("Failed to update order", 500);
        }
    }
}