import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { UploadedFile } from "express-fileupload";
import { Status } from "../../../generated/prisma";
import { v7 as uuidv7 } from "uuid";
import path from "path";
import fs from "fs/promises";
import {
    IBrandService,
    IBrandRepository,
    BrandData,
    CreateBrandRequest,
    BrandListResult,
    UploadResult
} from "../interfaces/brand.interfaces";
import { ValidationError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";

@injectable()
export class BrandService implements IBrandService {
    constructor(
        @inject(TYPES.BrandRepository) private brandRepository: IBrandRepository
    ) { }

    /**
     * Get paginated list of brands
     */
    async getBrands(page: number): Promise<BrandListResult> {
        const pageSize = 10;

        Logger.info("Fetching brands", { page, pageSize });

        const { brands, total } = await this.brandRepository.findBrands(page, pageSize);

        Logger.info("Brands retrieved successfully", {
            brandCount: brands.length,
            total,
            page
        });

        return {
            items: brands,
            pagination: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    /**
     * Create a new brand
     */
    async createBrand(request: CreateBrandRequest): Promise<BrandData> {
        const { nameTh, nameEn, createdById, image } = request;

        Logger.info("Creating new brand", { nameTh, nameEn, createdById });

        // 1. Validate brand name uniqueness
        await this.validateBrandName(nameTh, nameEn);

        // 2. Upload image if provided
        let imageUrl: string | undefined;
        if (image) {
            const uploadResult = await this.uploadBrandImage(image);
            imageUrl = uploadResult.imageUrl;
        }

        // 3. Create brand
        const brandData = {
            nameTh,
            nameEn,
            imageUrl,
            createdById,
            status: Status.ACTIVE,
        };

        const newBrand = await this.brandRepository.createBrand(brandData);

        // 4. Create image record if image was uploaded
        if (imageUrl) {
            await this.brandRepository.createBrandImage(newBrand.id, imageUrl, createdById);
        }

        Logger.info("Brand created successfully", {
            brandId: newBrand.id,
            nameTh: newBrand.nameTh,
            nameEn: newBrand.nameEn
        });

        return newBrand;
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
        const uploadPath = path.join(process.cwd(), "public/images/brands", newFileName);

        // Ensure directory exists
        await fs.mkdir(path.dirname(uploadPath), { recursive: true });

        // Save file
        await fs.writeFile(uploadPath, image.data);

        const imageUrl = `/images/brands/${newFileName}`;

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
     * Validate brand name uniqueness
     */
    async validateBrandName(nameTh: string, nameEn: string): Promise<void> {
        const existingBrand = await this.brandRepository.findBrandByName(nameTh, nameEn);

        if (existingBrand) {
            throw new ValidationError("Brand name is already in use");
        }
    }

    // Private helper methods
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
}
