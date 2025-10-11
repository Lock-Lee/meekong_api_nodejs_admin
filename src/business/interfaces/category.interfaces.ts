import { Status } from "../../../generated/prisma";

export interface TagData {
    id: string;
    name: string;
}

export interface ItemData {
    id: string;
    name: string;
}

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
    tag?: TagData[];
    items?: ItemData[];
    children?: CategoryData[];
}

export interface CreateCategoryRequest {
    nameTh: string;
    nameEn: string;
    imageUrl?: string;
    parentId?: string;
    level: number;
    tag?: string[];
    items?: string[];
}

export interface updateCategoryRequest {
    nameTh: string;
    nameEn: string;
    imageUrl?: string;
    parentId?: string;
    level: number;
    tag?: string[];
    items?: string[];
}

export interface CategoryHierarchy {
    id: string;
    nameTh: string;
    nameEn: string;
    imageUrl?: string;
    level: number;
    fullPath: string[];
    tag?: TagData[];
    items?: ItemData[];
    children: CategoryHierarchy[];
}


export interface CategoryListResult {
    items: CategoryHierarchy[];
    pagination: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
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
    assignTagsToCategory(categoryId: string, tagIds: string[]): Promise<number>
    removeTagsfromCategory(categoryId: string): Promise<number>
    replaceCategoryTags(
        categoryId: string,
        tagIds: string[]
    ): Promise<{ removed: number; added: number }>;
    replaceCategoryItems(
        categoryId: string,
        itemIds: string[]
    ): Promise<{ removed: number; added: number }>;
    assignItemsToCategory(categoryId: string, itemsId: string[]): Promise<number>
    removeItemsfromCategory(categoryId: string): Promise<number>
    updateCategoryLeafStatus(categoryId: string, isLeaf: boolean): Promise<void>;
    updateCategory(id: string, request: updateCategoryRequest): Promise<CategoryData>;
    deleteCategory(id: string): Promise<CategoryData>;
    // Hierarchy operations
    findTopLevelCategorieswithpage(page: number, pageSize: number): Promise<{ category: CategoryData[]; total: number }>;
    findChildrenTreeByParentId(parentId: string | null): Promise<CategoryData[]>
    findChildrenTreeByParentIdwithpage(page: number, pageSize: number, parentId: string | null): Promise<{ category: CategoryData[]; total: number }>;
    findTopLevelCategories(): Promise<CategoryData[]>;
    findCategoryWithChildren(id: string): Promise<CategoryData | null>;
    findCategoryWithSizeUnit(id: string): Promise<CategoryData | null>;
    findCategoryWithTags(id: string): Promise<CategoryData | null>;
    findCategoryWithSizeUnitId(id: string, sizeUnitId: string): Promise<CategoryData | null>;
}

/**
 * Service interface for category business logic
 */
export interface ICategoryService {
    // Category operations
    getAllCategories(): Promise<CategoryHierarchy[]>;
    getAllCategoriesWithChildren(page: number): Promise<CategoryListResult>;
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
