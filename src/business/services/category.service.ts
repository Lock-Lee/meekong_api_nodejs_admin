import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { Status } from "../../../generated/prisma";
import {
    ICategoryService,
    ICategoryRepository,
    CategoryData,
    CreateCategoryRequest,
    CategoryHierarchy,
    updateCategoryRequest
} from "../interfaces/category.interfaces";
import { ValidationError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";

@injectable()
export class CategoryService implements ICategoryService {
    constructor(
        @inject(TYPES.CategoryRepository) private categoryRepository: ICategoryRepository
    ) { }

    /**
     * Get all categories with hierarchy
     */
    async getAllCategories(): Promise<CategoryHierarchy[]> {
        Logger.info("Fetching all categories with hierarchy");

        const categories = await this.categoryRepository.findTopLevelCategories();
        const processedCategories = this.processCategories(categories);

        Logger.info("Categories retrieved successfully", {
            categoryCount: processedCategories.length
        });

        return this.buildCategoryHierarchy(processedCategories);
    }

    /**
     * Get category by ID with children
     */
    async getCategoryById(id: string): Promise<CategoryData | null> {
        Logger.info("Fetching category by ID", { categoryId: id });

        const category = await this.categoryRepository.findCategoryWithChildren(id);

        if (!category) {
            Logger.warn("Category not found", { categoryId: id });
            return null;
        }

        Logger.info("Category retrieved successfully", {
            categoryId: id,
            categoryName: category.nameTh
        });

        return category;
    }

    /**
     * Create a new category
     */
    async createCategory(request: CreateCategoryRequest): Promise<CategoryData> {
        const { nameTh, nameEn, imageUrl, parentId, level } = request;

        Logger.info("Creating new category", { nameTh, nameEn, level, parentId });

        // 1. Validate required fields
        this.validateCategoryRequest(request);

        // 2. Validate hierarchy and get parent if exists
        const parentCategory = await this.validateCategoryHierarchy(parentId, level);

        // 3. Build full path
        const fullPath = this.buildFullPath(parentCategory, level);

        // 4. Determine if this is a leaf category
        const isLeaf = level === 4; // Assuming level 4 is always a leaf node

        // 5. Create category
        const categoryData = {
            nameTh,
            nameEn,
            imageUrl,
            level,
            parentId,
            fullPath,
            isLeaf,
            status: Status.ACTIVE,
        };

        const newCategory = await this.categoryRepository.createCategory(categoryData);

        // 6. Update parent category leaf status if needed
        if (parentId && parentCategory && parentCategory.isLeaf) {
            await this.categoryRepository.updateCategoryLeafStatus(parentId, false);
        }

        Logger.info("Category created successfully", {
            categoryId: newCategory.id,
            nameTh: newCategory.nameTh,
            level: newCategory.level
        });

        return newCategory;
    }

    /**
   * Update a new category
   */
    async updateCategory(id: string, request: updateCategoryRequest): Promise<CategoryData> {
        const { nameTh, nameEn, imageUrl, parentId, level } = request;

        Logger.info("Update category", { nameTh, nameEn, level, parentId });

        // 1. Validate required fields
        this.validateCategoryRequest(request);

        // 2. Validate hierarchy and get parent if exists
        const parentCategory = await this.validateCategoryHierarchy(parentId, level);

        // 3. Build full path
        const fullPath = this.buildFullPath(parentCategory, level);

        // 4. Determine if this is a leaf category
        const isLeaf = level === 4; // Assuming level 4 is always a leaf node

        // 5. Create category
        const categoryData = {
            nameTh,
            nameEn,
            imageUrl,
            level,
            parentId,
            fullPath,
            isLeaf,
            status: Status.ACTIVE,
        };

        const newCategory = await this.categoryRepository.updateCategory(id, categoryData);

        // 6. Update parent category leaf status if needed
        if (parentId && parentCategory && parentCategory.isLeaf) {
            await this.categoryRepository.updateCategoryLeafStatus(parentId, false);
        }

        Logger.info("Category update successfully", {
            categoryId: newCategory.id,
            nameTh: newCategory.nameTh,
            level: newCategory.level
        });

        return newCategory;
    }

    async deleteCategory(id: string): Promise<CategoryData> {
        Logger.info(`Delete category id: ${id}`);
        const newCategory = await this.categoryRepository.deleteCategory(id);
        Logger.info("Category Delete successfully", {
            categoryId: newCategory.id,
            nameTh: newCategory.nameTh,
            level: newCategory.level
        });

        return newCategory;
    }


    /**
     * Validate category hierarchy
     */
    async validateCategoryHierarchy(parentId: string | undefined, level: number): Promise<CategoryData | null> {
        if (level < 1 || level > 4) {
            throw new ValidationError("Category level must be between 1 and 4");
        }

        if (level === 1) {
            if (parentId) {
                throw new ValidationError("Level 1 categories cannot have a parent");
            }
            return null;
        }

        if (!parentId) {
            throw new ValidationError("Parent ID is required for categories with level greater than 1");
        }

        const parentCategory = await this.categoryRepository.findCategoryById(parentId);
        if (!parentCategory) {
            throw new ValidationError("Parent category not found");
        }

        if (parentCategory.level >= level) {
            throw new ValidationError("Child category level must be greater than parent category level");
        }

        return parentCategory;
    }

    /**
     * Build category hierarchy from flat list
     */
    buildCategoryHierarchy(categories: CategoryData[]): CategoryHierarchy[] {
        return categories.map(category => this.mapToHierarchy(category));
    }

    // Private helper methods
    private validateCategoryRequest(request: CreateCategoryRequest): void {
        if (!request.nameTh || !request.nameEn) {
            throw new ValidationError("Missing required fields: nameTh, nameEn");
        }

        if (!request.level) {
            throw new ValidationError("Missing required field: level");
        }
    }

    private buildFullPath(parentCategory: CategoryData | null, level: number): string[] {
        if (level === 1) {
            return [""]; // As per original logic
        }

        if (!parentCategory) {
            throw new ValidationError("Parent category is required for levels > 1");
        }

        return parentCategory.fullPath
            .filter(p => p !== "")
            .concat(parentCategory.nameTh);
    }

    private processCategories(categories: CategoryData[]): CategoryData[] {
        return categories.map(category => {
            const processCategory = (cat: CategoryData): CategoryData => {
                // Handle fullPath for level 1 categories
                if (cat.level === 1 && cat.fullPath && cat.fullPath.length === 1 && cat.fullPath[0] === "") {
                    cat.fullPath = []; // Set to empty array if it's [""] for level 1
                }

                if (cat.children && cat.children.length > 0) {
                    cat.children = cat.children.map(processCategory);
                }

                return cat;
            };

            return processCategory(category);
        });
    }

    private mapToHierarchy(category: CategoryData): CategoryHierarchy {
        return {
            id: category.id,
            nameTh: category.nameTh,
            nameEn: category.nameEn,
            imageUrl: category.imageUrl,
            level: category.level,
            fullPath: category.fullPath,
            children: category.children ? category.children.map(child => this.mapToHierarchy(child)) : [],
        };
    }
}
