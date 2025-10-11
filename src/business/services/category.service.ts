import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { Status } from "../../../generated/prisma";
import {
    ICategoryService,
    ICategoryRepository,
    CategoryData,
    CreateCategoryRequest,
    CategoryHierarchy,
    updateCategoryRequest,
    CategoryListResult
} from "../interfaces/category.interfaces";
import { BusinessError, ValidationError } from "../../shared/errors/business.errors";
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

        const category = await this.categoryRepository.findTopLevelCategories();
        const processedCategories = this.processCategories(category);

        Logger.info("Categories retrieved successfully", {
            categoryCount: category.length
        });
        return this.buildCategoryHierarchy(processedCategories);
    }

    async getAllCategoriesWithChildren(page: number, parentId?: string): Promise<CategoryListResult> {
        const pageSize = 10;
        Logger.info("Fetching all categories with hierarchy");
        const { category, total } =
            parentId
                ? await this.categoryRepository.findChildrenTreeByParentIdwithpage(page, pageSize, parentId)
                : await this.categoryRepository.findTopLevelCategorieswithpage(page, pageSize);


        const processedCategories = this.processCategories(category);

        Logger.info("Categories retrieved successfully", {
            categoryCount: total
        });

        return {
            items: this.buildCategoryHierarchy(processedCategories),
            pagination: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            }
        }
    }
    async getChildrenByParentId(parentId?: string): Promise<CategoryHierarchy[]> {
        Logger.info("Fetching children with hierarchy", { parentId: parentId ?? null });

        const raw = parentId
            ? await this.categoryRepository.findChildrenTreeByParentId(parentId)
            : await this.categoryRepository.findChildrenTreeByParentId(null);

        const processed = this.processCategories(raw);

        Logger.info("Children retrieved successfully", {
            parentId: parentId ?? null,
            count: processed.length,
        });

        return this.buildCategoryHierarchy(processed);
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

    async getCategoryByIdWithSizeUnits(id: string): Promise<CategoryData | null> {
        Logger.info("Fetching category by ID", { categoryId: id });

        const category = await this.categoryRepository.findCategoryWithSizeUnit(id);

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

    async getCategoryByIdWithSizeUnitsId(id: string, sizeUnitId: string): Promise<CategoryData | null> {
        Logger.info("Fetching category by ID", { categoryId: id });

        const category = await this.categoryRepository.findCategoryWithSizeUnitId(id, sizeUnitId);

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

    async getCategoryByIdWithTags(id: string): Promise<CategoryData | null> {
        Logger.info("Fetching category by ID", { categoryId: id });

        const category = await this.categoryRepository.findCategoryWithTags(id);

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
        const { nameTh, nameEn, imageUrl, parentId, level, tag, items } = request;

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

        if (tag?.length) {
            await this.categoryRepository.replaceCategoryTags(newCategory.id, tag);
        }
        if (items?.length) {
            // await this.categoryRepository.replaceCategoryItems(newCategory.id, items);
            await this.categoryRepository.assignItemsToCategory(newCategory.id, items);

        }
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

    async createManyCategories(requests: CreateCategoryRequest[]): Promise<CategoryData[]> {

        const toCreate: Array<{
            data: Omit<CategoryData, "id" | "createdAt" | "updatedAt">;
            parentId?: string | null;
        }> = [];

        // Pre-validate & prepare
        for (const req of requests) {
            // 1) required fields
            this.validateCategoryRequest(req);

            // 2) parent & hierarchy
            const parentCategory = await this.validateCategoryHierarchy(req.parentId, req.level);

            // 3) build full path
            const fullPath = this.buildFullPath(parentCategory, req.level);

            // 4) isLeaf
            const isLeaf = req.level === 4;

            toCreate.push({
                data: {
                    nameTh: req.nameTh,
                    nameEn: req.nameEn,
                    imageUrl: req.imageUrl,
                    level: req.level,
                    parentId: req.parentId ?? undefined,
                    fullPath,
                    isLeaf,
                    status: Status.ACTIVE,
                },
                parentId: req.parentId ?? null,
            });
        }

        // 5) Transactionally create & update parents’ leaf flags
        const created = await this.categoryRepository.createManyCategories(toCreate);
        return created;
    }

    async upsertManyCategories(
        requests: (CreateCategoryRequest & { id?: string })[]
    ): Promise<CategoryData[]> {
        // Precompute each item’s derived fields (parent, fullPath, isLeaf)
        const work: Array<{
            mode: "create" | "update";
            id?: string;
            data: Omit<CategoryData, "id" | "createdAt" | "updatedAt">;
            parentId?: string | null; // for leaf bookkeeping
            // extra for updates
            oldParentId?: string | null;
        }> = [];

        for (const req of requests) {
            this.validateCategoryRequest(req);

            // If update, fetch current to know old parent and to validate existence
            let oldParentId: string | null | undefined = undefined;
            if (req.id) {
                const existing = await this.categoryRepository.findCategoryById(req.id);
                if (!existing) {
                    throw new BusinessError(`Category not found: ${req.id}`, 404);
                }
                oldParentId = existing.parentId ?? null;
            }

            const parent = await this.validateCategoryHierarchy(req.parentId, req.level);
            const fullPath = this.buildFullPath(parent, req.level);
            const isLeaf = req.level === 4;

            work.push({
                mode: req.id ? "update" : "create",
                id: req.id,
                data: {
                    nameTh: req.nameTh,
                    nameEn: req.nameEn,
                    imageUrl: req.imageUrl,
                    level: req.level,
                    parentId: req.parentId ?? undefined, // keep undefined over null if your types require it
                    fullPath,
                    isLeaf,
                    status: Status.ACTIVE,
                },
                parentId: req.parentId ?? null,
                oldParentId: oldParentId ?? null,
            });
        }

        // hand off to repo for 1 transaction
        return this.categoryRepository.upsertManyCategories(work);
    }
    /**
   * Update a new category
   */
    async updateCategory(id: string, request: updateCategoryRequest): Promise<CategoryData> {
        const { nameTh, nameEn, imageUrl, parentId, level, tag, items } = request;

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

        if (tag?.length) {
            await this.categoryRepository.replaceCategoryTags(newCategory.id, tag);
            // await this.categoryRepository.assignTagsToCategory(newCategory.id, tag);
        }
        if (items?.length) {
            // await this.categoryRepository.replaceCategoryItems(newCategory.id, items);
            await this.categoryRepository.assignItemsToCategory(newCategory.id, items);
        }
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
            tag: category.tag,
            items: category.items,
            fullPath: category.fullPath,
            children: category.children ? category.children.map(child => this.mapToHierarchy(child)) : [],
        };
    }
}
