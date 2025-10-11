import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { IRFQService } from "../../business/interfaces/rfq.interfaces";
import { z } from "zod";
import { RFQStatus, ItemType } from "../../../generated/prisma";
import { BusinessError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";
import Send from "../../shared/utils/response.utils";
import { Decimal } from "@prisma/client/runtime/library";

// Validation schemas
const createRFQSchema = z.object({
    nameTh: z.string().min(1, "Thai name is required"),
    nameEn: z.string().min(1, "English name is required"),
    description: z.string().min(1, "Description is required"),
    itemType: z.nativeEnum(ItemType),
    minBudget: z.number().min(0).optional(),
    maxBudget: z.number().min(0).optional(),
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
    categoryId: z.string().uuid().optional(),
    brandId: z.string().uuid().optional(),
    expireAt: z.string().datetime().optional(),
    imageUrl: z.string().url().optional(),
    images: z.array(z.string().url()).optional(),
    sizes: z.array(z.object({
        sizeUnitId: z.string().uuid(),
        value: z.string()
    })).optional()
});

const updateRFQSchema = createRFQSchema.partial().extend({
    status: z.nativeEnum(RFQStatus).optional()
});

const searchRFQSchema = z.object({
    page: z.string().transform(Number).pipe(z.number().int().min(1)).optional(),
    pageSize: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
    status: z.nativeEnum(RFQStatus).optional(),
    categoryId: z.string().uuid().optional(),
    brandId: z.string().uuid().optional(),
    requesterId: z.string().uuid().optional(),
    minBudget: z.string().transform(Number).pipe(z.number().min(0)).optional(),
    maxBudget: z.string().transform(Number).pipe(z.number().min(0)).optional(),
    itemType: z.nativeEnum(ItemType).optional(),
    search: z.string().optional()
});

const createQuotationSchema = z.object({
    itemPrice: z.number().min(0.01, "Price must be greater than 0"),
    itemId: z.string().uuid().optional(),
    itemVariantId: z.string().uuid().optional(),
    productName: z.string().optional(),
    productDescription: z.string().optional(),
    productImages: z.string().optional(),
    expireAt: z.string().datetime().optional()
});

const createOrderSchema = z.object({
    quotationId: z.string().uuid(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0.01),
    subtotal: z.number().min(0.01),
    shippingCost: z.number().min(0).optional(),
    commissionRate: z.number().min(0).max(100).optional(),
    commissionFee: z.number().min(0).optional(),
    totalAmount: z.number().min(0.01),
    itemId: z.string().uuid().optional(),
    itemVariantId: z.string().uuid().optional(),
    productName: z.string().optional(),
    productDescription: z.string().optional(),
    productImages: z.string().optional(),
    specialConditions: z.string().optional()
});

@injectable()
export class RFQController {
    constructor(
        @inject(TYPES.RFQService) private rfqService: IRFQService
    ) { }

    // Create RFQ
    async createRFQ(req: Request, res: Response): Promise<void> {
        try {
            const validation = createRFQSchema.safeParse(req.body);
            if (!validation.success) {
                return Send.error(res, validation.error.issues, "Invalid request data.", 400);
            }

            const userId = req.userId;
            if (!userId) {
                return Send.error(res, null, "Authentication required.", 401);
            }

            const createRequest = {
                ...validation.data,
                requesterId: userId,
                minBudget: validation.data.minBudget ? new Decimal(validation.data.minBudget) : undefined,
                maxBudget: validation.data.maxBudget ? new Decimal(validation.data.maxBudget) : undefined,
                expireAt: validation.data.expireAt ? new Date(validation.data.expireAt) : undefined,
            };

            const rfq = await this.rfqService.createRFQ(createRequest);
            return Send.success(res, rfq, "RFQ created successfully.");
        } catch (error) {
            Logger.error("Error creating RFQ", error);
            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }
            return Send.error(res, null, "Failed to create RFQ.");
        }
    }

    // Get RFQ by ID
    async getRFQ(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            if (!id) {
                return Send.error(res, null, "RFQ ID is required.", 400);
            }

            const rfq = await this.rfqService.getRFQById(id);
            if (!rfq) {
                return Send.error(res, null, "RFQ not found.", 404);
            }

            return Send.success(res, rfq, "RFQ retrieved successfully.");
        } catch (error) {
            Logger.error("Error getting RFQ", error);
            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }
            return Send.error(res, null, "Failed to get RFQ.");
        }
    }

    // Search RFQs
    async searchRFQs(req: Request, res: Response): Promise<void> {
        try {
            const validation = searchRFQSchema.safeParse(req.query);
            if (!validation.success) {
                return Send.error(res, validation.error.issues, "Invalid query parameters.", 400);
            }

            const searchRequest = {
                ...validation.data,
                minBudget: validation.data.minBudget ? new Decimal(validation.data.minBudget) : undefined,
                maxBudget: validation.data.maxBudget ? new Decimal(validation.data.maxBudget) : undefined,
            };

            const result = await this.rfqService.searchRFQs(searchRequest);
            const { rfqs, total, page, pageSize, totalPages } = result;
            return Send.success(res, rfqs, "RFQs retrieved successfully.", { total, page, pageSize, totalPages });
        } catch (error) {
            Logger.error("Error searching RFQs", error);
            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }
            return Send.error(res, null, "Failed to search RFQs.");
        }
    }

    // Update RFQ
    async updateRFQ(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            if (!id) {
                return Send.error(res, null, "RFQ ID is required.", 400);
            }

            const validation = updateRFQSchema.safeParse(req.body);
            if (!validation.success) {
                return Send.error(res, validation.error.issues, "Invalid request data.", 400);
            }

            const userId = req.userId;
            if (!userId) {
                return Send.error(res, null, "Authentication required.", 401);
            }

            const updateRequest = {
                ...validation.data,
                minBudget: validation.data.minBudget ? new Decimal(validation.data.minBudget) : undefined,
                maxBudget: validation.data.maxBudget ? new Decimal(validation.data.maxBudget) : undefined,
                expireAt: validation.data.expireAt ? new Date(validation.data.expireAt) : undefined,
            };

            const rfq = await this.rfqService.updateRFQ(id, updateRequest);
            return Send.success(res, rfq, "RFQ updated successfully.");
        } catch (error) {
            Logger.error("Error updating RFQ", error);
            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }
            return Send.error(res, null, "Failed to update RFQ.");
        }
    }

    // Delete RFQ
    async deleteRFQ(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            if (!id) {
                return Send.error(res, null, "RFQ ID is required.", 400);
            }

            const userId = req.userId;
            if (!userId) {
                return Send.error(res, null, "Authentication required.", 401);
            }

            await this.rfqService.deleteRFQ(id);
            return Send.success(res, null, "RFQ deleted successfully.");
        } catch (error) {
            Logger.error("Error deleting RFQ", error);
            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }
            return Send.error(res, null, "Failed to delete RFQ.");
        }
    }

    // Get my RFQs
    async getMyRFQs(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId;
            if (!userId) {
                return Send.error(res, null, "Authentication required.", 401);
            }

            const page = parseInt(req.query.page as string) || 1;
            const result = await this.rfqService.getMyRFQs(userId, page);
            const { rfqs, total, pageSize, totalPages } = result;
            return Send.success(res, rfqs, "Your RFQs retrieved successfully.", { total, page, pageSize, totalPages });
        } catch (error) {
            Logger.error("Error getting my RFQs", error);
            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }
            return Send.error(res, null, "Failed to get your RFQs.");
        }
    }

    // Submit quotation
    async submitQuotation(req: Request, res: Response): Promise<void> {
        try {
            const { rfqId } = req.params;
            if (!rfqId) {
                return Send.error(res, null, "RFQ ID is required.", 400);
            }

            const validation = createQuotationSchema.safeParse(req.body);
            if (!validation.success) {
                return Send.error(res, validation.error.issues, "Invalid request data.", 400);
            }

            const userId = req.userId;
            if (!userId) {
                return Send.error(res, null, "Authentication required.", 401);
            }

            const quotationRequest = {
                ...validation.data,
                rfqId,
                sellerId: userId,
                itemPrice: new Decimal(validation.data.itemPrice),
                expireAt: validation.data.expireAt ? new Date(validation.data.expireAt) : undefined,
            };

            const quotation = await this.rfqService.submitQuotation(quotationRequest);
            return Send.success(res, quotation, "Quotation submitted successfully.");
        } catch (error) {
            Logger.error("Error submitting quotation", error);
            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }
            return Send.error(res, null, "Failed to submit quotation.");
        }
    }

    // Get quotations for RFQ
    async getQuotations(req: Request, res: Response): Promise<void> {
        try {
            const { rfqId } = req.params;
            if (!rfqId) {
                return Send.error(res, null, "RFQ ID is required.", 400);
            }

            const quotations = await this.rfqService.getQuotationsForRFQ(rfqId);
            return Send.success(res, quotations, "Quotations retrieved successfully.");
        } catch (error) {
            Logger.error("Error getting quotations", error);
            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }
            return Send.error(res, null, "Failed to get quotations.");
        }
    }

    // Create order from quotation
    async createOrder(req: Request, res: Response): Promise<void> {
        try {
            const { rfqId, quotationId } = req.params;
            if (!rfqId || !quotationId) {
                return Send.error(res, null, "RFQ ID and Quotation ID are required.", 400);
            }

            const validation = createOrderSchema.safeParse(req.body);
            if (!validation.success) {
                return Send.error(res, validation.error.issues, "Invalid request data.", 400);
            }

            const userId = req.userId;
            if (!userId) {
                return Send.error(res, null, "Authentication required.", 401);
            }

            // Get quotation to get seller ID
            const quotation = await this.rfqService.getQuotationsForRFQ(rfqId);
            const selectedQuotation = quotation.find(q => q.id === quotationId);

            if (!selectedQuotation) {
                return Send.error(res, null, "Quotation not found.", 404);
            }

            const orderRequest = {
                ...validation.data,
                rfqId,
                quotationId,
                buyerId: userId,
                sellerId: selectedQuotation.sellerId,
                unitPrice: new Decimal(validation.data.unitPrice),
                subtotal: new Decimal(validation.data.subtotal),
                totalAmount: new Decimal(validation.data.totalAmount),
                shippingCost: validation.data.shippingCost ? new Decimal(validation.data.shippingCost) : undefined,
                commissionRate: validation.data.commissionRate ? new Decimal(validation.data.commissionRate) : undefined,
                commissionFee: validation.data.commissionFee ? new Decimal(validation.data.commissionFee) : undefined,
            };

            const order = await this.rfqService.createOrderFromQuotation(orderRequest);
            return Send.success(res, order, "Order created successfully.");
        } catch (error) {
            Logger.error("Error creating order", error);
            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }
            return Send.error(res, null, "Failed to create order.");
        }
    }

    // Get my orders
    async getMyOrders(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId;
            if (!userId) {
                return Send.error(res, null, "Authentication required.", 401);
            }

            const type = req.query.type as 'buyer' | 'seller';
            if (!type || !['buyer', 'seller'].includes(type)) {
                return Send.error(res, null, "Invalid type. Must be 'buyer' or 'seller'.", 400);
            }

            const orders = await this.rfqService.getMyRFQOrders(userId, type);
            return Send.success(res, orders, "Orders retrieved successfully.");
        } catch (error) {
            Logger.error("Error getting my orders", error);
            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }
            return Send.error(res, null, "Failed to get your orders.");
        }
    }

    // Get order by ID
    async getOrder(req: Request, res: Response): Promise<void> {
        try {
            const { orderId } = req.params;
            if (!orderId) {
                return Send.error(res, null, "Order ID is required.", 400);
            }

            const order = await this.rfqService.getRFQOrderById(orderId);
            if (!order) {
                return Send.error(res, null, "Order not found.", 404);
            }

            return Send.success(res, order, "Order retrieved successfully.");
        } catch (error) {
            Logger.error("Error getting order", error);
            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }
            return Send.error(res, null, "Failed to get order.");
        }
    }
}