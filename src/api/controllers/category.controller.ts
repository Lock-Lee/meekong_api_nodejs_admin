import { Request, Response } from "express";
import { injectable } from "inversify";
import Send from "@utils/response.utils";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import { ICategoryService } from "../../business/interfaces/category.interfaces";
import categorySchema from "@schemas/category.schemas";
import { BusinessError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";

@injectable()
export class CategoryController {
  private categoryService: ICategoryService;

  constructor() {
    this.categoryService = container.get<ICategoryService>(TYPES.CategoryService);
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
      const bodyValidation = categorySchema.createCategory.safeParse(req.body);
      if (!bodyValidation.success) {
        Logger.warn("Invalid request body for category creation", {
          errors: bodyValidation.error.errors,
          requestId: req.id
        });
        return Send.error(res, bodyValidation.error.errors, "Invalid request body.");
      }

      const categoryData = bodyValidation.data;

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
}

export default CategoryController;