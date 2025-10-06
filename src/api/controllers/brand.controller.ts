import { Request, Response } from "express";
import Send from "@utils/response.utils";
import { inject, injectable } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { IBrandService } from "../../business/interfaces/brand.interfaces";
import brandSchema from "@schemas/brand.schemas";
import { UploadedFile } from "express-fileupload";
import { BusinessError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";

@injectable()
export class BrandController {
  constructor(
    @inject(TYPES.BrandService) private readonly brandService: IBrandService
  ) { }

  /**
   * Get paginated list of brands
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const validation = brandSchema.listBrandsQuery.safeParse(req.query);
      if (!validation.success) {
        Logger.warn("Invalid query parameters for brand list", {
          errors: validation.error.issues,
          requestId: req.id
        });
        return Send.error(res, validation.error.issues, "Invalid query parameters.");
      }

      const { page } = validation.data;

      Logger.info("Listing brands", { page, requestId: req.id });

      const result = await this.brandService.getBrands(page);

      Logger.info("Brands retrieved successfully", {
        brandCount: result.items.length,
        total: result.pagination.total,
        requestId: req.id
      });

      return Send.success(res, result);
    } catch (error) {
      Logger.error("Failed to list brands", {
        error: (error as Error).message,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Failed to retrieve brands.");
    }
  }

  /**
   * Create a new brand
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const bodyValidation = brandSchema.createBrand.safeParse(req.body);
      if (!bodyValidation.success) {
        Logger.warn("Invalid request body for brand creation", {
          errors: bodyValidation.error.errors,
          requestId: req.id
        });
        return Send.error(res, bodyValidation.error.errors, "Invalid request body.");
      }

      const { nameTh, nameEn, createdById } = bodyValidation.data;
      const image = req.files?.image as UploadedFile | undefined;

      Logger.info("Creating new brand", {
        nameTh,
        nameEn,
        createdById,
        hasImage: !!image,
        requestId: req.id
      });

      const createRequest = {
        nameTh,
        nameEn,
        createdById,
        image,
      };

      const newBrand = await this.brandService.createBrand(createRequest);

      Logger.info("Brand created successfully", {
        brandId: newBrand.id,
        nameTh: newBrand.nameTh,
        nameEn: newBrand.nameEn,
        requestId: req.id
      });

      return Send.success(res, newBrand, "Brand created successfully.");
    } catch (error) {
      Logger.error("Failed to create brand", {
        error: (error as Error).message,
        brandName: req.body?.nameTh || req.body?.nameEn,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, error, "An internal server error occurred.");
    }
  }
}

export default BrandController;