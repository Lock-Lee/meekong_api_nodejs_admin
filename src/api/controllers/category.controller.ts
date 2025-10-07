import { Request, Response } from "express";
import { injectable } from "inversify";
import Send from "@utils/response.utils";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import { ICategoryService } from "../../business/interfaces/category.interfaces";
import categorySchema from "@schemas/category.schemas";
import { BusinessError, ValidationError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";
import { UploadedFile } from "express-fileupload";
import { UploadResult } from "@business/interfaces/brand.interfaces";
import { v7 as uuidv7 } from "uuid";
import path from "path";
import fs from "fs/promises";

@injectable()
export class CategoryController {
  private categoryService: ICategoryService;

  constructor() {
    this.categoryService = container.get<ICategoryService>(TYPES.CategoryService);
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
  /**
   * Upload brand image to filesystem
   */
  async uploadBrandImage(image: UploadedFile): Promise<UploadResult> {
    Logger.info("Uploading brand image", { filename: image.name, size: image.size });

    // Validate file
    this.validateImageFile(image);

    // Generate unique filename
    const fileExtension = path.extname(image.name);
    const newFileName = `${uuidv7()}${fileExtension}`;
    const uploadPath = path.join(process.cwd(), "public/images/category", newFileName);

    // Ensure directory exists
    await fs.mkdir(path.dirname(uploadPath), { recursive: true });

    // Save file
    await fs.writeFile(uploadPath, image.data);

    const imageUrl = `/images/category/${newFileName}`;

    Logger.info("Brand image uploaded successfully", {
      filename: newFileName,
      imageUrl
    });

    return {
      imageUrl,
      filePath: uploadPath,
    };
  }

  /**
   * Get all categories with hierarchy
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Fetching all categories", { requestId: req.id });

      const categories = await this.categoryService.getAllCategories();

      Logger.info("Categories retrieved successfully", {
        categoryCount: categories.length,
        requestId: req.id
      });

      return Send.success(res, categories, "Categories fetched successfully.");
    } catch (error) {
      Logger.error("Failed to fetch categories", {
        error: (error as Error).message,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Failed to fetch categories.");
    }
  }

  /**
   * Get category by ID with children
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const paramsValidation = categorySchema.getCategoryByIdParams.safeParse(req.params);
      if (!paramsValidation.success) {
        Logger.warn("Invalid parameters for category retrieval", {
          errors: paramsValidation.error.issues,
          requestId: req.id
        });
        return Send.error(res, paramsValidation.error.issues, "Invalid parameters.");
      }

      const { id } = paramsValidation.data;

      Logger.info("Fetching category by ID", { categoryId: id, requestId: req.id });

      const category = await this.categoryService.getCategoryById(id);

      if (!category) {
        Logger.warn("Category not found", { categoryId: id, requestId: req.id });
        return Send.error(res, null, "Category not found.");
      }

      Logger.info("Category retrieved successfully", {
        categoryId: id,
        categoryName: category.nameTh,
        requestId: req.id
      });

      return Send.success(res, category, "Category fetched successfully.");
    } catch (error) {
      Logger.error("Failed to fetch category by ID", {
        error: (error as Error).message,
        categoryId: req.params?.id,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Failed to fetch category.");
    }
  }

  /**
   * Create a new category
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const body = {
        ...req.body,
        level: parseInt(req.body.level)
      }
      const bodyValidation = categorySchema.createCategory.safeParse(body);
      if (!bodyValidation.success) {
        Logger.warn("Invalid request body for category creation", {
          errors: bodyValidation.error.errors,
          requestId: req.id
        });
        return Send.error(res, bodyValidation.error.errors, "Invalid request body.");
      }
      const images = req.files?.images as UploadedFile | undefined;
      if (images) {
        const uploadResult = await this.uploadBrandImage(images);
        bodyValidation.data.imageUrl = uploadResult.imageUrl;
      }
      const categoryData = { ...bodyValidation.data };

      Logger.info("Creating new category", {
        nameTh: categoryData.nameTh,
        nameEn: categoryData.nameEn,
        level: categoryData.level,
        parentId: categoryData.parentId,
        requestId: req.id
      });

      const newCategory = await this.categoryService.createCategory(categoryData);

      Logger.info("Category created successfully", {
        categoryId: newCategory.id,
        nameTh: newCategory.nameTh,
        level: newCategory.level,
        requestId: req.id
      });

      return Send.success(res, newCategory, "Category created successfully.");
    } catch (error) {
      Logger.error("Failed to create category", {
        error: (error as Error).message,
        categoryName: req.body?.nameTh || req.body?.nameEn,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Failed to create category.");
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const body = {
        ...req.body,
        level: parseInt(req.body.level)
      }
      const paramsValidation = categorySchema.updateCategoryParams.safeParse(req.params);
      if (!paramsValidation.success) {
        Logger.warn("Invalid parameters for category update", {
          errors: paramsValidation.error.issues,
          requestId: req.id
        });
        return Send.error(res, paramsValidation.error.issues, "Invalid parameters.");
      }

      const bodyValidation = categorySchema.updateCategory.safeParse(body);
      if (!bodyValidation.success) {
        Logger.warn("Invalid request body for category creation", {
          errors: bodyValidation.error.errors,
          requestId: req.id
        });
        return Send.error(res, bodyValidation.error.errors, "Invalid request body.");
      }
      const images = req.files?.images as UploadedFile | undefined;

      if (images) {
        const uploadResult = await this.uploadBrandImage(images);
        bodyValidation.data.imageUrl = uploadResult.imageUrl;
      }
      const { id } = paramsValidation.data;
      const categoryData = bodyValidation.data;

      Logger.info("Update category", {
        id: id,
        nameTh: categoryData.nameTh,
        nameEn: categoryData.nameEn,
        level: categoryData.level,
        parentId: categoryData.parentId,
        requestId: req.id
      });

      const newCategory = await this.categoryService.updateCategory(id, categoryData);

      Logger.info("Category update successfully", {
        categoryId: newCategory.id,
        nameTh: newCategory.nameTh,
        level: newCategory.level,
        requestId: req.id
      });

      return Send.success(res, newCategory, "Category update successfully.");
    } catch (error) {
      console.log(error);

      Logger.error("Failed to update category", {
        error: (error as Error).message,
        categoryName: req.body?.nameTh || req.body?.nameEn,
        categoryId: req.params?.id,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Failed to update category.");
    }
  }
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const paramsValidation = categorySchema.getCategoryByIdParams.safeParse(req.params);
      if (!paramsValidation.success) {
        Logger.warn("Invalid parameters for category retrieval", {
          errors: paramsValidation.error.issues,
          requestId: req.id
        });
        return Send.error(res, paramsValidation.error.issues, "Invalid parameters.");
      }

      const { id } = paramsValidation.data;

      Logger.info("Deleting category by ID", { categoryId: id, requestId: req.id });

      const category = await this.categoryService.deleteCategory(id);

      if (!category) {
        Logger.warn("Category not found", { categoryId: id, requestId: req.id });
        return Send.error(res, null, "Category not found.");
      }

      Logger.info("Category Deleting successfully", {
        categoryId: id,
        categoryName: category.nameTh,
        requestId: req.id
      });

      return Send.success(res, category, "Category Deleting successfully.");
    } catch (error) {
      Logger.error("Failed to fetch category by ID", {
        error: (error as Error).message,
        categoryId: req.params?.id,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Failed to fetch category.");
    }
  }
}

export default CategoryController;