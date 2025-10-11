import { injectable } from "inversify";
import { prisma } from "../database/db";
import {
    IRFQRepository,
    RFQData,
    SearchRFQRequest,
    CreateRFQSizeRequest,
    QuotationData,
    RFQOrderData
} from "../../business/interfaces/rfq.interfaces";
import { RFQImage, RFQQuotation, RFQOrder, RFQSize } from "../../../generated/prisma";
import { Logger } from "../../shared/utils/logger";

@injectable()
export class RFQRepository implements IRFQRepository {

    // RFQ CRUD Methods
    async createRFQ(data: Omit<RFQData, 'id' | 'createdAt' | 'updatedAt'>): Promise<RFQData> {
        Logger.info("Creating RFQ", { data });

        const rfq = await prisma.rFQ.create({
            data: {
                nameTh: data.nameTh,
                nameEn: data.nameEn,
                description: data.description,
                itemType: data.itemType,
                minBudget: data.minBudget,
                maxBudget: data.maxBudget,
                quantity: data.quantity,
                categoryId: data.categoryId,
                brandId: data.brandId,
                requesterId: data.requesterId,
                status: data.status,
                expireAt: data.expireAt,
                imageUrl: data.imageUrl,
            },
            include: {
                images: true,
                sizes: {
                    include: {
                        sizeUnit: true
                    }
                },
                quotations: {
                    include: {
                        seller: {
                            include: {
                                profile: true
                            }
                        }
                    }
                },
                orders: true,
                category: true,
                brand: true,
                requester: {
                    include: {
                        profile: true
                    }
                }
            }
        });

        return rfq as RFQData;
    }

    async findRFQById(id: string): Promise<RFQData | null> {
        Logger.info("Finding RFQ by ID", { id });

        const rfq = await prisma.rFQ.findUnique({
            where: { id },
            include: {
                images: true,
                sizes: {
                    include: {
                        sizeUnit: true
                    }
                },
                quotations: {
                    include: {
                        seller: {
                            include: {
                                profile: true
                            }
                        }
                    }
                },
                orders: true,
                category: true,
                brand: true,
                requester: {
                    include: {
                        profile: true
                    }
                }
            }
        });

        return rfq as RFQData | null;
    }

    async findRFQs(request: SearchRFQRequest): Promise<{ rfqs: RFQData[]; total: number }> {
        Logger.info("Searching RFQs", { request });

        const {
            page = 1,
            pageSize = 20,
            status,
            categoryId,
            brandId,
            requesterId,
            minBudget,
            maxBudget,
            itemType,
            search
        } = request;

        const skip = (page - 1) * pageSize;

        const where: Record<string, unknown> = {};

        if (status) where.status = status;
        if (categoryId) where.categoryId = categoryId;
        if (brandId) where.brandId = brandId;
        if (requesterId) where.requesterId = requesterId;
        if (itemType) where.itemType = itemType;

        if (minBudget !== undefined) {
            where.minBudget = { gte: minBudget };
        }

        if (maxBudget !== undefined) {
            where.maxBudget = { lte: maxBudget };
        }

        if (search) {
            where.OR = [
                { nameTh: { contains: search, mode: 'insensitive' } },
                { nameEn: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [rfqs, total] = await Promise.all([
            prisma.rFQ.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: {
                    images: true,
                    sizes: {
                        include: {
                            sizeUnit: true
                        }
                    },
                    quotations: {
                        include: {
                            seller: {
                                include: {
                                    profile: true
                                }
                            }
                        }
                    },
                    orders: true,
                    category: true,
                    brand: true,
                    requester: {
                        include: {
                            profile: true
                        }
                    }
                }
            }),
            prisma.rFQ.count({ where })
        ]);

        return { rfqs: rfqs as RFQData[], total };
    }

    async updateRFQ(id: string, data: Partial<RFQData>): Promise<RFQData> {
        Logger.info("Updating RFQ", { id, data });

        const rfq = await prisma.rFQ.update({
            where: { id },
            data: {
                nameTh: data.nameTh,
                nameEn: data.nameEn,
                description: data.description,
                itemType: data.itemType,
                minBudget: data.minBudget,
                maxBudget: data.maxBudget,
                quantity: data.quantity,
                categoryId: data.categoryId,
                brandId: data.brandId,
                status: data.status,
                expireAt: data.expireAt,
                imageUrl: data.imageUrl,
            },
            include: {
                images: true,
                sizes: {
                    include: {
                        sizeUnit: true
                    }
                },
                quotations: {
                    include: {
                        seller: {
                            include: {
                                profile: true
                            }
                        }
                    }
                },
                orders: true,
                category: true,
                brand: true,
                requester: {
                    include: {
                        profile: true
                    }
                }
            }
        });

        return rfq as RFQData;
    }

    async deleteRFQ(id: string): Promise<void> {
        Logger.info("Deleting RFQ", { id });

        // Delete related records first
        await prisma.rFQImage.deleteMany({ where: { rfqId: id } });
        await prisma.rFQSize.deleteMany({ where: { rfqId: id } });
        await prisma.rFQQuotation.deleteMany({ where: { rfqId: id } });

        // Delete the RFQ
        await prisma.rFQ.delete({ where: { id } });
    }

    // RFQ Images Methods
    async addRFQImages(rfqId: string, imageUrls: string[]): Promise<RFQImage[]> {
        Logger.info("Adding RFQ images", { rfqId, imageUrls });

        const images = await Promise.all(
            imageUrls.map(imageUrl =>
                prisma.rFQImage.create({
                    data: {
                        rfqId,
                        imageUrl,
                        imageId: "" // You might want to create actual Image records
                    }
                })
            )
        );

        return images;
    }

    async removeRFQImages(rfqId: string, imageIds?: string[]): Promise<void> {
        Logger.info("Removing RFQ images", { rfqId, imageIds });

        const where: Record<string, unknown> = { rfqId };
        if (imageIds && imageIds.length > 0) {
            where.id = { in: imageIds };
        }

        await prisma.rFQImage.deleteMany({ where });
    }

    // RFQ Sizes Methods
    async addRFQSizes(rfqId: string, sizes: CreateRFQSizeRequest[]): Promise<RFQSize[]> {
        Logger.info("Adding RFQ sizes", { rfqId, sizes });

        const rfqSizes = await Promise.all(
            sizes.map(size =>
                prisma.rFQSize.create({
                    data: {
                        rfqId,
                        sizeUnitId: size.sizeUnitId,
                        value: size.value
                    }
                })
            )
        );

        return rfqSizes;
    }

    async updateRFQSizes(rfqId: string, sizes: CreateRFQSizeRequest[]): Promise<RFQSize[]> {
        Logger.info("Updating RFQ sizes", { rfqId, sizes });

        // Delete existing sizes
        await prisma.rFQSize.deleteMany({ where: { rfqId } });

        // Add new sizes
        return this.addRFQSizes(rfqId, sizes);
    }

    // Quotation Methods
    async createQuotation(data: Omit<RFQQuotation, 'id' | 'createdAt' | 'updatedAt'>): Promise<QuotationData> {
        Logger.info("Creating quotation", { data });

        const quotation = await prisma.rFQQuotation.create({
            data,
            include: {
                seller: {
                    include: {
                        profile: true
                    }
                },
                rfq: true
            }
        });

        return quotation as QuotationData;
    }

    async findQuotationsByRFQ(rfqId: string): Promise<QuotationData[]> {
        Logger.info("Finding quotations by RFQ", { rfqId });

        const quotations = await prisma.rFQQuotation.findMany({
            where: { rfqId },
            include: {
                seller: {
                    include: {
                        profile: true
                    }
                },
                rfq: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return quotations as QuotationData[];
    }

    async findQuotationById(id: string): Promise<QuotationData | null> {
        Logger.info("Finding quotation by ID", { id });

        const quotation = await prisma.rFQQuotation.findUnique({
            where: { id },
            include: {
                seller: {
                    include: {
                        profile: true
                    }
                },
                rfq: true
            }
        });

        return quotation as QuotationData | null;
    }

    async updateQuotation(id: string, data: Partial<RFQQuotation>): Promise<QuotationData> {
        Logger.info("Updating quotation", { id, data });

        const quotation = await prisma.rFQQuotation.update({
            where: { id },
            data,
            include: {
                seller: {
                    include: {
                        profile: true
                    }
                },
                rfq: true
            }
        });

        return quotation as QuotationData;
    }

    async deleteQuotation(id: string): Promise<void> {
        Logger.info("Deleting quotation", { id });
        await prisma.rFQQuotation.delete({ where: { id } });
    }

    // RFQ Order Methods
    async createRFQOrder(data: Omit<RFQOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<RFQOrderData> {
        Logger.info("Creating RFQ order", { data });

        const order = await prisma.rFQOrder.create({
            data,
            include: {
                buyer: {
                    include: {
                        profile: true
                    }
                },
                seller: {
                    include: {
                        profile: true
                    }
                },
                rfq: true,
                quotation: {
                    include: {
                        seller: {
                            include: {
                                profile: true
                            }
                        }
                    }
                }
            }
        });

        return order as RFQOrderData;
    }

    async findRFQOrderById(id: string): Promise<RFQOrderData | null> {
        Logger.info("Finding RFQ order by ID", { id });

        const order = await prisma.rFQOrder.findUnique({
            where: { id },
            include: {
                buyer: {
                    include: {
                        profile: true
                    }
                },
                seller: {
                    include: {
                        profile: true
                    }
                },
                rfq: true,
                quotation: {
                    include: {
                        seller: {
                            include: {
                                profile: true
                            }
                        }
                    }
                }
            }
        });

        return order as RFQOrderData | null;
    }

    async findRFQOrdersByBuyer(buyerId: string): Promise<RFQOrderData[]> {
        Logger.info("Finding RFQ orders by buyer", { buyerId });

        const orders = await prisma.rFQOrder.findMany({
            where: { buyerId },
            include: {
                buyer: {
                    include: {
                        profile: true
                    }
                },
                seller: {
                    include: {
                        profile: true
                    }
                },
                rfq: true,
                quotation: {
                    include: {
                        seller: {
                            include: {
                                profile: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return orders as RFQOrderData[];
    }

    async findRFQOrdersBySeller(sellerId: string): Promise<RFQOrderData[]> {
        Logger.info("Finding RFQ orders by seller", { sellerId });

        const orders = await prisma.rFQOrder.findMany({
            where: { sellerId },
            include: {
                buyer: {
                    include: {
                        profile: true
                    }
                },
                seller: {
                    include: {
                        profile: true
                    }
                },
                rfq: true,
                quotation: {
                    include: {
                        seller: {
                            include: {
                                profile: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return orders as RFQOrderData[];
    }

    async updateRFQOrder(id: string, data: Partial<RFQOrder>): Promise<RFQOrderData> {
        Logger.info("Updating RFQ order", { id, data });

        const order = await prisma.rFQOrder.update({
            where: { id },
            data,
            include: {
                buyer: {
                    include: {
                        profile: true
                    }
                },
                seller: {
                    include: {
                        profile: true
                    }
                },
                rfq: true,
                quotation: {
                    include: {
                        seller: {
                            include: {
                                profile: true
                            }
                        }
                    }
                }
            }
        });

        return order as RFQOrderData;
    }
}