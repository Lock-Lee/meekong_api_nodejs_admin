import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { BuyerReportData, IBuyerReportRepository, FindBuyerReportParams, IBuyerReportService, UploadImageResult } from "../interfaces/buyer-report.interfaces";
import { Logger } from "../../shared/utils/logger";
import { UploadedFile } from "express-fileupload";
import { ValidationError } from "@shared/errors/business.errors";
import path from "path";
import fs from "fs/promises";
import { v7 as uuidv7 } from "uuid";
@injectable()
export class BuyerReportService implements IBuyerReportService {

    constructor(
        @inject(TYPES.BuyerReportRepository) private buyerReportRepository: IBuyerReportRepository
    ) { }

    async getBuyerReport(params: FindBuyerReportParams): Promise<BuyerReportData[]> {
        try {
            Logger.info("Fetching buyer reports", { params });
            const buyerReports = await this.buyerReportRepository.findBuyerReport(params);
            Logger.info("Buyer reports retrieved", { buyerReports });
            return buyerReports;
        } catch (error) {
            Logger.error("Failed to fetch buyer reports", { error });
            throw error;
        }


    }

    async createBuyerReport(
        data: Omit<BuyerReportData, 'id' | 'createdAt' | 'images'> & { images?: UploadedFile | UploadedFile[] }
    ): Promise<BuyerReportData> {
        try {
            Logger.info("Creating buyer report", { data });

            const imageUrls: string[] = [];

            if (data.images) {
                const files = Array.isArray(data.images) ? data.images : [data.images];
                for (const file of files) {
                    const uploadResult = await this.uploadProfileImage(file as UploadedFile);
                    imageUrls.push(uploadResult.imageUrl);
                }
            }

            const buyerReport = await this.buyerReportRepository.createBuyerReport({
                buyerId: data.buyerId,
                itemId: data.itemId,
                typeId: data.typeId,
                shopId: data.shopId,
                reason: data.reason,
                images: imageUrls || [],
            });
            Logger.info("Buyer report created", { buyerReport });
            return buyerReport;
        } catch (error) {
            Logger.error("Failed to create buyer report", { error });
            throw error;
        }
    }

    async uploadProfileImage(image: UploadedFile): Promise<UploadImageResult> {
        Logger.info("Uploading profile image", { filename: image.name, size: image.size });

        // Validate image
        this.validateImageFile(image);

        const uploadPath = path.join(process.cwd(), "public/images/reportItem");
        await fs.mkdir(uploadPath, { recursive: true });

        const newImageId = uuidv7();
        const fileExtension = path.extname(image.name);
        const newFileName = `${newImageId}${fileExtension}`;
        const filePath = path.join(uploadPath, newFileName);

        await image.mv(filePath);

        const imageUrl = `/images/reportItem/${newFileName}`;

        Logger.info("Profile image uploaded successfully", {
            filename: newFileName,
            imageUrl
        });

        return {
            imageUrl,
            filePath,
            imageId: newImageId,
        };
    }
    private validateImageFile(file: UploadedFile): void {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(file.mimetype)) {
            throw new ValidationError(
                `Invalid image format. Allowed formats: ${allowedTypes.join(', ')}`
            );
        }

        if (file.size > maxSize) {
            throw new ValidationError(
                `Image size too large. Maximum size: ${maxSize / (1024 * 1024)}MB`
            );
        }
    }
}
