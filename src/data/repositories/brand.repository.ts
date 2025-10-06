import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { ImageType } from "../../../generated/prisma";
import {
    IBrandRepository,
    BrandData
} from "../../business/interfaces/brand.interfaces";

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
