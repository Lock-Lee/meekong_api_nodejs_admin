import { Request, Response } from "express";
import { injectable } from "inversify";
import Send from "@utils/response.utils";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import { Logger } from "../../shared/utils/logger";
import { IBuyerReportService } from "../../business/interfaces/buyer-report.interfaces";
import type { UploadedFile } from "express-fileupload";

@injectable()
export class BuyerReportController {
  private buyerReportService: IBuyerReportService;

  constructor() {
    this.buyerReportService = container.get<IBuyerReportService>(TYPES.BuyerReportService);
  }

  async getBuyerReport(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Fetching all buyer reports", { requestId: req.id });

      const { shopId, itemId, typeId } = req.query;
      const userId = req.userId as string;

      const buyerReports = await this.buyerReportService.getBuyerReport({ buyerId: userId as string, shopId: shopId as string, itemId: itemId as string, typeId: typeId as string });

      Logger.info("Buyer reports retrieved successfully", {
        buyerReportCount: buyerReports.length,
        requestId: req.id,
      });

      Send.success(res, buyerReports);
    } catch (error) {
      Logger.error("Error fetching buyer reports", { requestId: req.id, error });
      Send.error(res, error);
    }
  }

  async createBuyerReport(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Creating buyer report", {
        requestId: req.id,
        files: req.files ? Object.keys(req.files) : 'no files',
        body: req.body
      });

      const images = req.files?.images as UploadedFile[] | UploadedFile | undefined;
      const imageArray = images ? (Array.isArray(images) ? images : [images]) : [];

      Logger.debug("Processing buyer report with images", {
        imageCount: imageArray.length,
        imageNames: imageArray.map(img => img?.name || 'invalid')
      });

      const buyerReportData = {
        ...req.body,
        buyerId: req.userId, // Ensure buyerId comes from the authenticated user
        images: imageArray
      };

      const buyerReport = await this.buyerReportService.createBuyerReport(buyerReportData);

      Logger.info("Buyer report created successfully", {
        buyerReportId: buyerReport.id,
        requestId: req.id,
      });

      Send.success(res, buyerReport);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      Logger.error("Error creating buyer report", {
        requestId: req.id,
        error: errorMessage,
        stack: errorStack,
        body: req.body,
        files: req.files ? Object.keys(req.files) : 'no files'
      });

      Send.error(res, error);
    }
  }
}
