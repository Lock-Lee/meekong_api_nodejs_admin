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

export interface CategoryHierarchy {
    id: string;
    nameTh: string;
    nameEn: string;
    imageUrl?: string;
    level: number;
    fullPath: string[];
    children: CategoryHierarchy[];
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
    updateCategoryLeafStatus(categoryId: string, isLeaf: boolean): Promise<void>;

    // Hierarchy operations
    findTopLevelCategories(): Promise<CategoryData[]>;
    findCategoryWithChildren(id: string): Promise<CategoryData | null>;
}

/**
 * Service interface for category business logic
 */
export interface ICategoryService {
    // Category operations
    getAllCategories(): Promise<CategoryHierarchy[]>;
    getCategoryById(id: string): Promise<CategoryData | null>;
    createCategory(request: CreateCategoryRequest): Promise<CategoryData>;

    // Business logic
    validateCategoryHierarchy(parentId: string | undefined, level: number): Promise<CategoryData | null>;
    buildCategoryHierarchy(categories: CategoryData[]): CategoryHierarchy[];
}
