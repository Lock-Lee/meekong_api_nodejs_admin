import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import {
    CheckoutRequest,
    CheckoutResult,
    IBuyerCheckoutRepository,
    UpdateOrderStatusRequest,
    UpdateOrderStatusResult
} from "../../business/interfaces/buyer-checkout.interfaces";
import { PrismaClient, OrderStatus } from "../../../generated/prisma";


@injectable()
export class BuyerCheckoutRepository implements IBuyerCheckoutRepository {
    private prisma: PrismaClient;

    constructor(
        @inject(TYPES.PrismaClient) prisma: PrismaClient
    ) {
        this.prisma = prisma;
    }
    async checkout(data: CheckoutRequest): Promise<CheckoutResult> {

        return this.prisma.$transaction(async (prisma) => {

            const order = await prisma.order.create({
                data: {
                    status: "PENDING",
                    buyerId: data.buyerId,
                    subtotal: data.subtotal,
                    shippingCost: data.shippingCost,
                    commissionFee: data.commissionFee,
                    totalAmount: data.totalAmount,
                    createdAt: new Date(),
                    items: {
                        create: data.items.map(item => ({
                            quantity: item.quantity,
                            price: item.price,
                            item: {
                                connect: { id: item.itemId }
                            },
                            variant: {
                                connect: { id: item.variantId }
                            },
                            shop: {
                                connect: { id: item.shopId }
                            }
                        })),
                    },
                },
            });

            const removedCartItems = await prisma.cartItem.findMany({
                where: {
                    userId: data.userId,
                    itemId: { in: data.items.map(item => item.itemId) },
                },
                select: { id: true },
            });

            await prisma.cartItem.deleteMany({
                where: {
                    userId: data.userId,
                    itemId: { in: data.items.map(item => item.itemId) },
                },
            });

            const inventoryLogs = await Promise.all(
                data.items.map(item =>
                    prisma.inventoryLog.create({
                        data: {
                            itemId: item.itemId,
                            variantId: item.variantId,
                            quantity: item.quantity,
                            action: "REMOVE",
                            balance: 0,
                        },
                    })
                )
            );

            const variantUpdates = await Promise.all(
                data.items.map(item =>
                    prisma.itemVariant.update({
                        where: { id: item.variantId },
                        data: {
                            stock: {
                                decrement: item.quantity,
                            },
                        },
                        select: {
                            id: true,
                            stock: true
                        }
                    })
                )
            );

            const updatedVariants = variantUpdates.map(variant => ({
                variantId: variant.id,
                newStock: variant.stock
            }));

            const transformedInventoryLogs = inventoryLogs.map(log => ({
                itemId: log.itemId,
                variantId: log.variantId,
                action: "REMOVE" as const,
                quantity: log.quantity,
                balance: log.balance,
                reason: log.reason || undefined
            }));

            return {
                orderId: order.id,
                status: order.status,
                removedCartItemIds: removedCartItems.map(item => item.id),
                updatedVariants,
                inventoryLogs: transformedInventoryLogs,
            };
        });
    }

    async updateOrderStatus(data: UpdateOrderStatusRequest): Promise<UpdateOrderStatusResult> {
        const order = await this.prisma.order.update({
            where: { id: data.orderId },
            data: {
                status: data.status as OrderStatus,
                updatedAt: new Date()
            },
            select: {
                id: true,
                status: true,
                updatedAt: true
            }
        });

        return {
            orderId: order.id,
            status: order.status,
            updatedAt: order.updatedAt
        };
    }
}


