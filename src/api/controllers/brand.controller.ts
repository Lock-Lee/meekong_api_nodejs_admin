import { Request, Response } from "express";
import Send from "@utils/response.utils";
import { inject, injectable } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { IBrandService, UpdateBrandRequest } from "../../business/interfaces/brand.interfaces";
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


  async listbyId(req: Request, res: Response): Promise<void> {
    try {

      const id = req.params.id;

      Logger.info("Getting brands", { requestId: req.id });

      const result = await this.brandService.getBrandsbyId(id);

      Logger.info("Brands retrieved successfully", {
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

  async deletebyId(req: Request, res: Response): Promise<void> {
    try {

      const id = req.params.id;

      Logger.info("Getting brands", { requestId: req.id });

      const result = await this.brandService.deleteBrandsbyId(id);

      Logger.info("Brands retrieved successfully", {
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

  async update(req: Request, res: Response): Promise<void> {
    const id = req.params.id;

    try {
      const bodyValidation = brandSchema.updateBrand.safeParse(req.body);
      if (!bodyValidation.success) {
        Logger.warn("Invalid request body for brand update", {
          errors: bodyValidation.error.errors,
          requestId: req.id,
          brandId: id,
        });
        return Send.error(res, bodyValidation.error.errors, "Invalid request body.");
      }

      const { nameTh, nameEn, updatedById } = bodyValidation.data;
      const image = req.files?.image as UploadedFile | undefined;

      Logger.info("Updating brand", {
        id,
        nameTh,
        nameEn,
        updatedById,
        hasImage: !!image,
        requestId: req.id,
      });

      const updateRequest: UpdateBrandRequest = {
        nameTh,
        nameEn,
        updatedById,
        image, // optional
      };

      const updated = await this.brandService.updateBrand(id, updateRequest);

      Logger.info("Brand updated successfully", {
        brandId: updated.id,
        requestId: req.id,
      });

      return Send.success(res, updated, "Brand updated successfully.");
    } catch (error) {
      Logger.error("Failed to update brand", {
        error: (error as Error).message,
        brandId: req.params?.id,
        requestId: req.id,
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, error, "An internal server error occurred.");
    }
  }

  async bulkUpsert(req: Request, res: Response): Promise<void> {
    try {
      const parse = brandSchema.bulkUpsert.safeParse(req.body);
      if (!parse.success) {
        Logger.warn("Invalid request body for brand bulk upsert", {
          errors: parse.error.errors,
          requestId: req.id,
        });
        return Send.error(res, parse.error.errors, "Invalid request body.");
      }

      const { items } = parse.data;

      Logger.info("Bulk upsert brands", {
        count: items.length,
        requestId: req.id,
      });

      const result = await this.brandService.bulkUpsertBrands(items);

      Logger.info("Bulk upsert completed", {
        created: result.created.length,
        updated: result.updated.length,
        errors: result.errors.length,
        requestId: req.id,
      });

      return Send.success(res, result, "Bulk upsert completed.");
    } catch (error) {
      Logger.error("Failed bulk upsert brands", {
        error: (error as Error).message,
        requestId: req.id,
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, error, "An internal server error occurred.");
    }
  }

  async updateImage(req: Request, res: Response): Promise<void> {
    const id = req.params.id;

    try {
      const image = req.files?.image as UploadedFile | undefined;
      const actorId = (req.body?.actorId as string | undefined) ?? undefined;

      if (!image) {
        Logger.warn("No image provided for brand image update", { brandId: id, requestId: req.id });
        return Send.error(res, null, "Image file is required.", 400);
      }

      // (Optional) quick mime/size validation
      const allowed = ["image/png", "image/jpeg", "image/webp"];
      if (!allowed.includes(image.mimetype)) {
        return Send.error(res, null, "Unsupported media type.", 415);
      }

      Logger.info("Updating brand image", {
        brandId: id,
        hasImage: true,
        actorId,
        requestId: req.id,
      });

      const updated = await this.brandService.changeBrandImage(id, image, actorId);

      Logger.info("Brand image updated", { brandId: updated.id, requestId: req.id });

      return Send.success(res, { id: updated.id, imageUrl: updated.imageUrl }, "Brand image updated successfully.");
    } catch (error) {
      Logger.error("Failed to update brand image", {
        error: (error as Error).message,
        brandId: req.params?.id,
        requestId: req.id,
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, error, "An internal server error occurred.");
    }
  }
  async deleteImage(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    const actorId = (req.query?.actorId as string | undefined) ?? (req.body?.actorId as string | undefined);

    try {
      Logger.info("Deleting brand image", { brandId: id, actorId, requestId: req.id });

      const updated = await this.brandService.deleteBrandImage(id, actorId);

      Logger.info("Brand image deleted", { brandId: updated.id, requestId: req.id });

      return Send.success(res, { id: updated.id, imageUrl: updated.imageUrl ?? null }, "Brand image deleted successfully.");
    } catch (error) {
      Logger.error("Failed to delete brand image", {
        error: (error as Error).message,
        brandId: id,
        requestId: req.id,
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, error, "An internal server error occurred.");
    }
  }



}

export default BrandController;