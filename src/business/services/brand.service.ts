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
    UploadResult,
    UpdateBrandRequest,
    BulkUpsertItem,
    BulkUpsertResult
} from "../interfaces/brand.interfaces";
import { BusinessError, ValidationError } from "../../shared/errors/business.errors";
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

    async getBrandsbyId(id: string): Promise<BrandData | null> {
        Logger.info("Fetching brands");

        const brands = await this.brandRepository.findById(id);

        Logger.info("Brands retrieved successfully", {
            brands
        });

        return brands
    }

    async deleteBrandsbyId(id: string): Promise<BrandData | null> {
        Logger.info("Deleting brands");

        const brands = await this.brandRepository.deleteBrand(id);

        Logger.info("Brands delete successfully", {
            brands
        });

        return brands
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
    async changeBrandImage(brandId: string, image: UploadedFile, actorId?: string): Promise<BrandData> {
        const existing = await this.brandRepository.findById(brandId);
        if (!existing) {
            throw new BusinessError("Brand not found", 404);
        }

        // Upload file to your storage
        const upload = await this.uploadBrandImage(image); // returns { imageUrl: string }

        // Update brand record (imageUrl)
        const updated = await this.brandRepository.updateBrand(brandId, {
            imageUrl: upload.imageUrl,
            ...(actorId ? { updatedById: actorId } as any : {}),
        });

        // Keep image history: make new one primary, demote old primaries
        await this.brandRepository.setBrandImagesNonPrimary(brandId);
        await this.brandRepository.createBrandImage(brandId, upload.imageUrl, actorId ?? existing.createdById);

        return updated;
    }

    async deleteBrandImage(brandId: string, actorId?: string): Promise<BrandData> {
        // 1) Ensure brand exists
        const existing = await this.brandRepository.findById(brandId);
        if (!existing) throw new BusinessError("Brand not found", 404);

        // 2) Determine current image to remove
        const currentUrl = existing.imageUrl;
        if (!currentUrl) {
            throw new BusinessError("No image to delete", 404);
        }

        // Try to find its image record (primary)
        const primary = await this.brandRepository.findPrimaryBrandImage(brandId);

        // 3) Clear image on brand
        const updated = await this.brandRepository.updateBrand(brandId, {
            imageUrl: null as any, // Prisma/DB should allow null for this column
            ...(actorId ? { updatedById: actorId } as any : {}),
        });

        // 4) Remove image record (or at least mark non-primary)
        if (primary) {
            await this.brandRepository.deleteImageById(primary.id);
        } else {
            // Fallback: delete by URL if primary record not found
            await this.brandRepository.deleteImagesByUrl(brandId, currentUrl);
        }

        // 5) (Optional) delete physical file if local
        // Only do this if you know images are stored locally at /public/images/brands/*
        try {
            if (currentUrl.startsWith("/images/brands/")) {
                const filePath = path.join(process.cwd(), "public", currentUrl);
                await fs.unlink(filePath).catch(() => { });
            }
        } catch {
            // ignore file deletion errors
        }

        return updated;
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

    async updateBrand(id: string, request: UpdateBrandRequest): Promise<BrandData> {
        const { nameTh, nameEn, updatedById, image } = request;

        // Ensure the brand exists
        const existing = await this.brandRepository.findById(id);
        if (!existing) {
            throw new BusinessError("Brand not found", 404);
        }

        // If names are provided (and changed), validate uniqueness (exclude self)
        const nextNameTh = nameTh ?? existing.nameTh;
        const nextNameEn = nameEn ?? existing.nameEn;
        if (nextNameTh !== existing.nameTh || nextNameEn !== existing.nameEn) {
            await this.validateBrandName(nextNameTh, nextNameEn); // excludeId support
        }

        // Optional image upload
        let newImageUrl: string | undefined;
        if (image) {
            const uploadResult = await this.uploadBrandImage(image);
            newImageUrl = uploadResult.imageUrl;
        }

        // Build update payload (only include provided fields)
        const updateData: Partial<Omit<BrandData, "id" | "createdAt" | "updatedAt">> = {};
        if (nameTh !== undefined) updateData.nameTh = nameTh;
        if (nameEn !== undefined) updateData.nameEn = nameEn;
        if (newImageUrl !== undefined) updateData.imageUrl = newImageUrl;
        if (updatedById !== undefined) (updateData as any).updatedById = updatedById; // if your model has it

        const updated = await this.brandRepository.updateBrand(id, updateData);

        // Persist image record if a new image was uploaded
        if (newImageUrl) {
            // Optional: demote old primaries first (keeps image history clean)
            await this.brandRepository.setBrandImagesNonPrimary(id);
            await this.brandRepository.createBrandImage(id, newImageUrl, updatedById ?? existing.createdById);
        }

        return updated;
    }

    async bulkUpsertBrands(items: BulkUpsertItem[]): Promise<BulkUpsertResult> {
        // Optional: quick client-side duplicate check within the payload itself
        // to avoid obvious conflicts (same nameTh/nameEn appearing twice).
        const comboKey = (nTh: string, nEn: string) => `${nTh}__${nEn}`.toLowerCase();
        const seen = new Set<string>();
        const duplicatesInPayload: number[] = [];
        items.forEach((it, idx) => {
            const key = comboKey(it.nameTh.trim(), it.nameEn.trim());
            if (seen.has(key)) duplicatesInPayload.push(idx);
            seen.add(key);
        });

        const result: BulkUpsertResult = { created: [], updated: [], errors: [] };

        // If duplicates detected in the same payload, mark them as errors but continue others
        for (const i of duplicatesInPayload) {
            result.errors.push({ index: i, id: items[i].id, message: "Duplicate brand name in payload" });
        }

        // Process items (skip those flagged as duplicates above)
        await this.brandRepository.transaction(async (txRepo) => {
            for (let i = 0; i < items.length; i++) {
                if (duplicatesInPayload.includes(i)) continue; // already errored
                const it = items[i];

                try {
                    if (it.id) {
                        // UPDATE
                        const existing = await txRepo.findById(it.id);
                        if (!existing) {
                            result.errors.push({ index: i, id: it.id, message: "Brand not found" });
                            continue;
                        }
                        // Uniqueness (exclude self)
                        await this.validateBrandName(it.nameTh, it.nameEn);

                        const updated = await txRepo.updateBrand(it.id, {
                            nameTh: it.nameTh,
                            nameEn: it.nameEn,
                            ...(it.actorId ? { updatedById: it.actorId } as any : {}),
                        });

                        result.updated.push(updated);
                    } else {
                        // CREATE
                        await this.validateBrandName(it.nameTh, it.nameEn);
                        const created = await txRepo.createBrand({
                            nameTh: it.nameTh,
                            nameEn: it.nameEn,
                            createdById: it.actorId,
                            // optional imageUrl: undefined,
                            status: Status.ACTIVE,
                        });
                        result.created.push(created);
                    }
                } catch (e: any) {
                    // Collect per-item error but continue processing others
                    const msg = e instanceof BusinessError ? e.message : (e?.message ?? "Unknown error");
                    result.errors.push({ index: i, id: it.id, message: msg });
                }
            }
        });

        return result;
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
