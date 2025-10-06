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

export interface BrandListResult {
    items: BrandData[];
    pagination: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}

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

    // Image operations
    createBrandImage(brandId: string, imageUrl: string, createdById: string): Promise<void>;
}

/**
 * Service interface for brand business logic
 */
export interface IBrandService {
    // Brand operations
    getBrands(page: number): Promise<BrandListResult>;
    createBrand(request: CreateBrandRequest): Promise<BrandData>;

    // File operations
    uploadBrandImage(image: UploadedFile): Promise<UploadResult>;

    // Validation
    validateBrandName(nameTh: string, nameEn: string): Promise<void>;
}
