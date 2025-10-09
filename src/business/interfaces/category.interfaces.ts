import { Status } from "../../../generated/prisma";

export interface CategoryData {
    id: string;
    nameTh: string;
    nameEn: string;
    imageUrl?: string;
    level: number;
    parentId?: string;
    fullPath: string[];
    isLeaf: boolean;
    status: Status;
    createdAt: Date;
    updatedAt: Date;
    children?: CategoryData[];
}

export interface CreateCategoryRequest {
    nameTh: string;
    nameEn: string;
    imageUrl?: string;
    parentId?: string;
    level: number;
}

export interface updateCategoryRequest {
    nameTh: string;
    nameEn: string;
    imageUrl?: string;
    parentId?: string;
    level: number;
}

export interface CategoryHierarchy {
    id: string;
    nameTh: string;
    nameEn: string;
    imageUrl?: string;
    level: number;
    fullPath: string[];
    children: CategoryHierarchy[];
}
export interface UpsertWorkItem {
    mode: "create" | "update";
    id?: string;
    data: Omit<CategoryData, "id" | "createdAt" | "updatedAt">;
    parentId?: string | null;
    oldParentId?: string | null;
}
/**
 * Repository interface for category-related data operations
 */
export interface ICategoryRepository {
    // Category operations
    findAllActiveCategories(): Promise<CategoryData[]>;
    findCategoryById(id: string): Promise<CategoryData | null>;
    findCategoryByParentId(parentId: string): Promise<CategoryData[]>;
    createCategory(data: Omit<CategoryData, 'id' | 'createdAt' | 'updatedAt'>): Promise<CategoryData>;
    createManyCategories(items: Array<{
        data: Omit<CategoryData, 'id' | 'createdAt' | 'updatedAt'>;
        parentId?: string | null;
    }>): Promise<CategoryData[]>;
    upsertManyCategories(items: UpsertWorkItem[]): Promise<CategoryData[]>;
    updateCategoryLeafStatus(categoryId: string, isLeaf: boolean): Promise<void>;
    updateCategory(id: string, request: updateCategoryRequest): Promise<CategoryData>;
    deleteCategory(id: string): Promise<CategoryData>;
    // Hierarchy operations
    findTopLevelCategories(): Promise<CategoryData[]>;
    findCategoryWithChildren(id: string): Promise<CategoryData | null>;
    findCategoryWithSizeUnit(id: string): Promise<CategoryData | null>;
    findChildrenTreeByParentId(id: string | null): Promise<CategoryData[]>;
    findCategoryWithTags(id: string): Promise<CategoryData | null>;
    findCategoryWithSizeUnitId(id: string, sizeUnitId: string): Promise<CategoryData | null>;
}

/**
 * Service interface for category business logic
 */
export interface ICategoryService {
    // Category operations
    getAllCategories(): Promise<CategoryHierarchy[]>;
    getAllCategoriesWithChildren(): Promise<CategoryHierarchy[]>;
    getChildrenByParentId(parentId?: string): Promise<CategoryHierarchy[]>;
    getCategoryById(id: string): Promise<CategoryData | null>;
    getCategoryByIdWithSizeUnits(id: string): Promise<CategoryData | null>;
    getCategoryByIdWithTags(id: string): Promise<CategoryData | null>;
    getCategoryByIdWithSizeUnitsId(id: string, sizeUnitId: string): Promise<CategoryData | null>;
    createCategory(request: CreateCategoryRequest): Promise<CategoryData>;
    createManyCategories(requests: CreateCategoryRequest[]): Promise<CategoryData[]>;
    upsertManyCategories(requests: CreateCategoryRequest[]): Promise<CategoryData[]>;
    updateCategory(id: string, request: updateCategoryRequest): Promise<CategoryData>;
    deleteCategory(id: string): Promise<CategoryData>;
    // Business logic
    validateCategoryHierarchy(parentId: string | undefined, level: number): Promise<CategoryData | null>;
    buildCategoryHierarchy(categories: CategoryData[]): CategoryHierarchy[];
}
