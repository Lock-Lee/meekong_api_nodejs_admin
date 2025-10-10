import { UploadedFile } from "express-fileupload";
import { Status } from "../../../generated/prisma";

export interface BrandData {
    id: string;
    nameTh: string;
    nameEn: string;
    imageUrl?: string;
    status: Status;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateBrandRequest {
    nameTh: string;
    nameEn: string;
    createdById: string;
    image?: UploadedFile;
}

export interface UpdateBrandRequest {
    nameTh?: string;
    nameEn?: string;
    updatedById?: string;
    image?: UploadedFile;
}

export interface BrandListResult {
    items: BrandData[];
    pagination: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}

export type BulkUpsertItem = {
    id?: string;
    nameTh: string;
    nameEn: string;
    actorId: string;
};

export type BulkUpsertResult = {
    created: BrandData[];
    updated: BrandData[];
    errors: Array<{ index: number; id?: string; message: string }>;
};

export interface UploadResult {
    imageUrl: string;
    filePath: string;
}

/**
 * Repository interface for brand-related data operations
 */
export interface IBrandRepository {
    // Brand operations
    findBrands(page: number, pageSize: number): Promise<{ brands: BrandData[]; total: number }>;
    findBrandByName(nameTh: string, nameEn: string): Promise<BrandData | null>;
    createBrand(data: Omit<BrandData, 'id' | 'createdAt' | 'updatedAt'>): Promise<BrandData>;
    deleteBrand(id: string): Promise<BrandData | null>;
    /** Get a brand by ID (null if not found). */
    findById(id: string): Promise<BrandData | null>;

    /**
     * Update an existing brand. Only provided fields are updated.
     * `data` should exclude immutable fields like id/createdAt/updatedAt.
     */
    updateBrand(
        id: string,
        data: Partial<Omit<BrandData, 'id' | 'createdAt' | 'updatedAt'>>
    ): Promise<BrandData>;

    /**
     * Check if Thai or English name already exists.
     * If `excludeId` is provided, that brand will be ignored in the check (useful for updates).
     */
    isNameTaken(nameTh: string, nameEn: string, excludeId?: string): Promise<boolean>;

    // Image operations
    createBrandImage(brandId: string, imageUrl: string, createdById: string): Promise<void>;

    setBrandImagesNonPrimary(brandId: string): Promise<void>
    transaction<T>(fn: (repo: IBrandRepository) => Promise<T>): Promise<T>;
    findPrimaryBrandImage(brandId: string): Promise<{ id: string; imageUrl: string } | null>;
    deleteImageById(imageId: string): Promise<void>;
    deleteImagesByUrl(brandId: string, imageUrl: string): Promise<number>;
}

/**
 * Service interface for brand business logic
 */
export interface IBrandService {
    // Brand operations
    getBrands(page: number): Promise<BrandListResult>;
    getBrandsbyId(id: string): Promise<BrandData | null>;
    deleteBrandsbyId(id: string): Promise<BrandData | null>;
    createBrand(request: CreateBrandRequest): Promise<BrandData>;
    bulkUpsertBrands(items: BulkUpsertItem[]): Promise<BulkUpsertResult>;
    /** Update an existing brand (partial update). */
    updateBrand(id: string, request: UpdateBrandRequest): Promise<BrandData>;
    deleteBrandImage(brandId: string, actorId?: string): Promise<BrandData>
    // File operations
    uploadBrandImage(image: UploadedFile): Promise<UploadResult>;
    changeBrandImage(brandId: string, image: UploadedFile, actorId?: string): Promise<BrandData>
    // Validation
    validateBrandName(nameTh: string, nameEn: string): Promise<void>;
}
