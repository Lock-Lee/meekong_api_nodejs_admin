import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import {
    IFileRepository,
    ImageData,
    CreateImageData
} from "../../business/interfaces/file.interfaces";

@injectable()
export class FileRepository implements IFileRepository {
    constructor(
        @inject(TYPES.PrismaClient) private prisma: any
    ) { }

    /**
     * Create multiple images
     */
    async createImages(imageData: CreateImageData[]): Promise<ImageData[]> {
        // Map the interface fields to Prisma schema fields
        const mappedData = imageData.map(data => ({
            imageUrl: data.url,
            altText: data.altText,
            isPrimary: data.isPrimary,
            type: data.imageType,
            targetId: data.itemId,
            createdById: data.uploadedBy
        }));

        await this.prisma.image.createMany({
            data: mappedData
        });

        // Since createMany doesn't return the created records, fetch them
        const createdImages = await this.prisma.image.findMany({
            where: {
                targetId: imageData[0]?.itemId,
                imageUrl: { in: imageData.map(img => img.url) }
            },
            orderBy: { createdAt: 'desc' }
        });

        return createdImages.map((img: any) => this.mapToImageData(img));
    }

    /**
     * Find images by item ID
     */
    async findImagesByItemId(itemId: string): Promise<ImageData[]> {
        const images = await this.prisma.image.findMany({
            where: { targetId: itemId },
            orderBy: [
                { isPrimary: 'desc' },
                { createdAt: 'asc' }
            ]
        });

        return images.map((img: any) => this.mapToImageData(img));
    }

    /**
     * Delete all images for an item
     */
    async deleteImagesByItemId(itemId: string): Promise<void> {
        await this.prisma.image.deleteMany({
            where: { targetId: itemId }
        });
    }

    /**
     * Delete images by IDs
     */
    async deleteImagesByIds(imageIds: string[]): Promise<void> {
        await this.prisma.image.deleteMany({
            where: {
                id: { in: imageIds }
            }
        });
    }

    /**
     * Update primary image for an item
     */
    async updateImagePrimary(itemId: string, imageId: string): Promise<void> {
        await this.prisma.$transaction(async (tx: any) => {
            // First, set all images for this item to not primary
            await tx.image.updateMany({
                where: { targetId: itemId },
                data: { isPrimary: false }
            });

            // Then set the specified image as primary
            await tx.image.update({
                where: { id: imageId },
                data: { isPrimary: true }
            });
        });
    }

    /**
     * Find orphaned images (images with no associated item)
     */
    async findOrphanedImages(beforeDate: Date): Promise<ImageData[]> {
        const orphanedImages = await this.prisma.image.findMany({
            where: {
                OR: [
                    { targetId: null },
                    {
                        type: 'ITEM',
                        createdAt: { lt: beforeDate }
                    }
                ]
            }
        });

        return orphanedImages.map((img: any) => this.mapToImageData(img));
    }

    // Mapper
    private mapToImageData(image: any): ImageData {
        return {
            id: image.id,
            url: image.imageUrl,
            altText: image.altText,
            isPrimary: image.isPrimary || false,
            imageType: image.type,
            itemId: image.targetId,
            uploadedBy: image.createdById,
            createdAt: image.createdAt,
            updatedAt: image.updatedAt
        };
    }
}
