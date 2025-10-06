import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { PrismaClient } from "@prisma/client";
import {
    IBuyerReportRepository,
    BuyerReportData,
    CreateBuyerReportRequest,
    FindBuyerReportParams,
} from "../../business/interfaces/buyer-report.interfaces";
import { Logger } from "../../shared/utils/logger";

@injectable()
export class BuyerReportRepository implements IBuyerReportRepository {
    private prisma: PrismaClient;

    constructor(
        @inject(TYPES.PrismaClient) prisma: PrismaClient
    ) {
        this.prisma = prisma;
    }

    async createBuyerReport(data: CreateBuyerReportRequest): Promise<BuyerReportData> {
        try {
            Logger.info("Creating buyer report in database", { data });
            console.log("data", data);
            const buyerReport = await this.prisma.BuyerReportItem.create({
                data: {
                    buyerId: data.buyerId,
                    typeId: data.typeId,
                    reason: data.reason,
                    images: data.images,
                    shopId: data.shopId,
                    itemId: data.itemId
                },
            });
            Logger.info("Buyer report created successfully", { id: buyerReport.id });
            return this.mapCreateToBuyerReportData(buyerReport);
        } catch (error) {
            Logger.error("Failed to create buyer report", { error });
            throw error;
        }
    }

    async findBuyerReport(params: FindBuyerReportParams): Promise<BuyerReportData[]> {
        try {
            Logger.info("Fetching buyer reports with params:", { params });

            const { buyerId, typeId, shopId, itemId } = params;

            const buyerReports = await this.prisma.BuyerReportItem.findMany({
                where: {
                    buyerId,
                    ...(typeId && { typeId }),
                    ...(shopId && { shopId }),
                    ...(itemId && { itemId }),
                },
                include: {
                    buyer: {
                        include: {
                            profile: true
                        }
                    },
                    shop: true,
                    item: true,
                    type: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            // Map the results to match the BuyerReportData interface
            return buyerReports.map((report: any) => ({
                id: report.id,
                buyerId: report.buyerId,
                typeId: report.typeId,
                reason: report.reason,
                images: report.images,
                shopId: report.shopId,
                itemId: report.itemId,
                createdAt: report.createdAt,
                user: report.buyer ? {
                    id: report.buyer.id,
                    profile: report.buyer.profile ? {
                        avatarUrl: report.buyer.profile.avatarUrl || '',
                        firstName: report.buyer.profile.firstName || '',
                        lastName: report.buyer.profile.lastName || ''
                    } : undefined
                } : undefined,
                shop: report.shop ? {
                    id: report.shop.id,
                    name: report.shop.name || ''
                } : undefined,
                item: report.item ? {
                    id: report.item.id,
                    nameTh: report.item.nameTh,
                    nameEn: report.item.nameEn,
                    descriptionTh: report.item.descriptionTh,
                    descriptionEn: report.item.descriptionEn,
                    images: report.item.images,
                    imagesUrl: report.item.imagesUrl
                } : undefined,
                type: report.type ? {
                    id: report.type.id,
                    name: report.type.name
                } : undefined
            }));
        } catch (error) {
            Logger.error("Error in findBuyerReport:", { error });
            throw error;
        }
    }

    private mapCreateToBuyerReportData(data: CreateBuyerReportRequest): any {
        return {
            buyerId: data.buyerId,
            typeId: data.typeId,
            reason: data.reason,
            images: data.images || [],
            shopId: data.shopId,
            itemId: data.itemId,
            createdAt: new Date(),
        };
    }

    private mapToBuyerReportData(buyerReport: any): BuyerReportData {
        return {
            id: buyerReport.id,
            buyerId: buyerReport.buyerId,
            typeId: buyerReport.typeId,
            reason: buyerReport.reason,
            images: buyerReport.images,
            shopId: buyerReport.shopId,
            itemId: buyerReport.itemId,
            createdAt: buyerReport.createdAt,
            user: {
                id: buyerReport.user.id,
                profile: {
                    avatarUrl: buyerReport.user.profile.avatarUrl,
                    firstName: buyerReport.user.profile.firstName,
                    lastName: buyerReport.user.profile.lastName,
                },
            },
            shop: {
                id: buyerReport.shop.id,
                name: buyerReport.shop.name,
            },
            item: {
                id: buyerReport.item.id,
                nameTh: buyerReport.item.nameTh,
                nameEn: buyerReport.item.nameEn,
                descriptionTh: buyerReport.item.descriptionTh,
                descriptionEn: buyerReport.item.descriptionEn,
                images: buyerReport.item.images,
                imagesUrl: buyerReport.item.imagesUrl,
            },
            type: {
                id: buyerReport.type.id,
                name: buyerReport.type.name,
            }
        };
    }
}