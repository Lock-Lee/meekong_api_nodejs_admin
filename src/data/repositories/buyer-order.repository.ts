import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { PrismaClient } from "@prisma/client";
import { Logger } from "@utils/logger";
import {
    IBuyerOrderRepository,
    BuyerOrderData
} from "../../business/interfaces/buyer-order.interfaces";
import { OrderStatus } from "../../../generated/prisma";

@injectable()
export class BuyerOrderRepository implements IBuyerOrderRepository {
    private prisma: PrismaClient;

    constructor(
        @inject(TYPES.PrismaClient) prisma: PrismaClient
    ) {
        this.prisma = prisma;
    }

    async findBuyerOrderByStatus(userId: string, status: OrderStatus): Promise<BuyerOrderData[]> {
        // Ensure status is in uppercase to match the enum
        const statusUpper = status.toUpperCase() as OrderStatus;

        Logger.info(`Fetching orders with status: ${statusUpper} for user: ${userId}`);

        return this.prisma.Order.findMany({
            where: {
                buyerId: userId,
                status: statusUpper
            },
            select: {
                id: true,
                buyerId: true,
                subtotal: true,
                shippingCost: true,
                commissionFee: true,
                totalAmount: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                items: {
                    select: {
                        id: true,
                        orderId: true,
                        itemId: true,
                        variantId: true,
                        shopId: true,
                        quantity: true,
                        unitPrice: true,
                        subTotal: true,
                        commissionRate: true,
                        commissionFee: true,
                        item: {
                            select: {
                                id: true,
                                code: true,
                                nameTh: true,
                                nameEn: true,
                                descriptionTh: true,
                                descriptionEn: true,
                                imageUrl: true,
                                itemType: true,
                                sellType: true,
                                variantType: true,
                                status: true
                            }
                        },
                       
                    }
                }
            }
        });
    }

    async findAllBuyerOrderSummary(userId: string): Promise<BuyerOrderData[]> {
        try {
            Logger.info(`Fetching all buyer orders for user: ${userId}`);

            const orders = await this.prisma.Order.groupBy({
                by: ['status'],
                where: {
                    buyerId: userId
                },
                _count: {
                    status: true
                }
            });

            // Transform the result to match the expected format
            const result = orders.map((group: { status: OrderStatus; _count: { status: number } }) => ({
                status: group.status,
                count: group._count.status
            }));

            Logger.info(`Successfully retrieved order counts for user: ${userId}`);
            return result;
        } catch (error) {
            Logger.error(`Error fetching buyer orders for user ${userId}:`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            throw new Error('Failed to fetch buyer orders. Please try again later.');
        }
    }
}
