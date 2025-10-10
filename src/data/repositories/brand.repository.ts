import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { ImageType } from "../../../generated/prisma";
import {
    IBrandRepository,
    BrandData
} from "../../business/interfaces/brand.interfaces";
import { BusinessError } from "@shared/errors/business.errors";
import { Prisma, PrismaClient } from "@prisma/client";

@injectable()
export class BrandRepository implements IBrandRepository {
    constructor(
        @inject(TYPES.PrismaClient) private prisma: any
    ) { }

    /**
     * Find brands with pagination
     */
    async findBrands(page: number, pageSize: number): Promise<{ brands: BrandData[]; total: number }> {
        const skip = (page - 1) * pageSize;

        const [brands, total] = await this.prisma.$transaction([
            this.prisma.brand.findMany({
                take: pageSize,
                skip,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    nameTh: true,
                    nameEn: true,
                    imageUrl: true,
                    status: true,
                    createdById: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            this.prisma.brand.count(),
        ]);

        return {
            brands: brands.map((brand: any) => this.mapToBrandData(brand)),
            total,
        };
    }

    /**
     * Find brand by name (Thai or English)
     */
    async findBrandByName(nameTh: string, nameEn: string): Promise<BrandData | null> {
        const brand = await this.prisma.brand.findFirst({
            where: {
                OR: [{ nameTh }, { nameEn }]
            },
        });

        return brand ? this.mapToBrandData(brand) : null;
    }
    /**
     * Create a new brand
     */
    async createBrand(data: Omit<BrandData, 'id' | 'createdAt' | 'updatedAt'>): Promise<BrandData> {
        const brand = await this.prisma.brand.create({
            data: {
                nameTh: data.nameTh,
                nameEn: data.nameEn,
                imageUrl: data.imageUrl,
                createdById: data.createdById,
                status: data.status,
            },
        });

        return this.mapToBrandData(brand);
    }

    /**
     * Create brand image record
     */
    async createBrandImage(brandId: string, imageUrl: string, createdById: string): Promise<void> {
        await this.prisma.image.create({
            data: {
                targetId: brandId,
                type: ImageType.BRAND,
                imageUrl: imageUrl,
                isPrimary: true,
                createdById: createdById,
            },
        });
    }


    async findById(id: string): Promise<BrandData | null> {
        const brand = await this.prisma.brand.findUnique({ where: { id } });
        return brand ? this.mapToBrandData(brand) : null;
    }

    async deleteBrand(id: string): Promise<BrandData | null> {
        const brand = await this.prisma.brand.delete({ where: { id } });
        return brand ? this.mapToBrandData(brand) : null;
    }
    async updateBrand(
        id: string,
        data: Partial<Omit<BrandData, "id" | "createdAt" | "updatedAt">>
    ): Promise<BrandData> {
        const brand = await this.prisma.brand.update({
            where: { id },
            data: {
                ...(data.nameTh !== undefined ? { nameTh: data.nameTh } : {}),
                ...(data.nameEn !== undefined ? { nameEn: data.nameEn } : {}),
                ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
                ...(data as any).updatedById !== undefined ? { updatedById: (data as any).updatedById } : {},
                // Prisma will touch updatedAt automatically if you have an updatedAt default/update trigger
            },
        });

        return this.mapToBrandData(brand);
    }

    /**
     * Uniqueness check helper. Excludes a given brand ID if provided.
     */
    async isNameTaken(nameTh: string, nameEn: string, excludeId?: string): Promise<boolean> {
        const found = await this.prisma.brand.findFirst({
            where: {
                OR: [{ nameTh }, { nameEn }],
                ...(excludeId ? { NOT: { id: excludeId } } : {}),
            },
            select: { id: true },
        });
        return !!found;
    }

    /**
     * Used by service.validateBrandName
     */
    async validateBrandName(nameTh: string, nameEn: string, excludeId?: string): Promise<void> {
        const taken = await this.isNameTaken(nameTh, nameEn, excludeId);
        if (taken) throw new BusinessError("Brand name already exists", 409);
    }

    /**
     * Optional: demote existing brand images from primary before creating a new one
     */
    async setBrandImagesNonPrimary(brandId: string): Promise<void> {
        await this.prisma.image.updateMany({
            where: { targetId: brandId, type: ImageType.BRAND, isPrimary: true },
            data: { isPrimary: false },
        });
    }
    async findPrimaryBrandImage(brandId: string): Promise<{ id: string; imageUrl: string } | null> {
        const img = await this.prisma.image.findFirst({
            where: { targetId: brandId, type: ImageType.BRAND, isPrimary: true },
            select: { id: true, imageUrl: true },
        });
        return img ?? null;
    }

    async deleteImageById(imageId: string): Promise<void> {
        await this.prisma.image.delete({ where: { id: imageId } });
    }

    async deleteImagesByUrl(brandId: string, imageUrl: string): Promise<number> {
        const res = await this.prisma.image.deleteMany({
            where: { targetId: brandId, type: ImageType.BRAND, imageUrl },
        });
        return res.count;
    }

    async transaction<T>(fn: (repo: IBrandRepository) => Promise<T>): Promise<T> {
        return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Create a scoped repo that uses tx instead of root prisma
            const scoped = new BrandRepository(tx as unknown as PrismaClient);
            return fn(scoped);
        });
    }
    // Mapper
    private mapToBrandData(brand: any): BrandData {
        return {
            id: brand.id,
            nameTh: brand.nameTh,
            nameEn: brand.nameEn,
            imageUrl: brand.imageUrl,
            status: brand.status,
            createdById: brand.createdById,
            createdAt: brand.createdAt,
            updatedAt: brand.updatedAt,
        };
    }
}
