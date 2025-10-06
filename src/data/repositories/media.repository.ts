import { injectable, inject } from "inversify";
import { TYPES } from "@shared/types/service.types";
import { MediaType } from "../../../generated/prisma";
import { IMediaRepository, MediaRecord } from "@business/interfaces/media.interfaces";

@injectable()
export class MediaRepository implements IMediaRepository {
    constructor(@inject(TYPES.PrismaClient) private prisma: any) { }

    async countImages(itemId: string): Promise<number> {
        return this.prisma.image.count({ where: { targetId: itemId, type: 'ITEM', mediaType: MediaType.IMAGE } });
    }

    async hasVideo(itemId: string): Promise<boolean> {
        const count = await this.prisma.image.count({ where: { targetId: itemId, type: 'ITEM', mediaType: MediaType.VIDEO } });
        return count > 0;
    }

    async isItemOwnedBy(itemId: string, userId: string): Promise<boolean> {
        const item = await this.prisma.item.findFirst({ where: { id: itemId, sellerId: userId }, select: { id: true } });
        return !!item;
    }

    async createImage(itemId: string, url: string, isPrimary: boolean, userId: string): Promise<MediaRecord> {
        // Use transaction to ensure primary image consistency
        const result = await this.prisma.$transaction(async (tx: any) => {
            // If this image should be primary, unset all other primary images for this item
            if (isPrimary) {
                await tx.image.updateMany({
                    where: {
                        targetId: itemId,
                        type: 'ITEM',
                        mediaType: MediaType.IMAGE
                    },
                    data: { isPrimary: false }
                });
            }

            // Create the new image
            const created = await tx.image.create({
                data: { imageUrl: url, type: 'ITEM', mediaType: MediaType.IMAGE, isPrimary, targetId: itemId, createdById: userId },
                select: { id: true, imageUrl: true, mediaType: true, isPrimary: true },
            });

            return created;
        });

        return { id: result.id, url: result.imageUrl, mediaType: result.mediaType, isPrimary: result.isPrimary };
    }

    async createVideo(itemId: string, url: string, userId: string): Promise<MediaRecord> {
        const created = await this.prisma.image.create({
            data: { imageUrl: url, type: 'ITEM', mediaType: MediaType.VIDEO, isPrimary: false, targetId: itemId, createdById: userId },
            select: { id: true, imageUrl: true, mediaType: true, isPrimary: true },
        });
        return { id: created.id, url: created.imageUrl, mediaType: created.mediaType, isPrimary: created.isPrimary };
    }

    async listItemMedia(itemId: string): Promise<MediaRecord[]> {
        const items = await this.prisma.image.findMany({
            where: { targetId: itemId, type: 'ITEM' },
            select: { id: true, imageUrl: true, mediaType: true, isPrimary: true },
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        });
        return items.map((i: any) => ({ id: i.id, url: i.imageUrl, mediaType: i.mediaType, isPrimary: i.isPrimary }));
    }

    async getMediaOwnership(mediaId: string): Promise<{ itemId: string; sellerId: string; url: string; mediaType: MediaType; isPrimary: boolean } | null> {
        const media = await this.prisma.image.findUnique({
            where: { id: mediaId },
            select: { id: true, imageUrl: true, mediaType: true, isPrimary: true, targetId: true },
        });
        if (!media) return null;
        const item = await this.prisma.item.findUnique({ where: { id: media.targetId }, select: { id: true, sellerId: true } });
        if (!item) return null;
        return { itemId: item.id, sellerId: item.sellerId, url: media.imageUrl, mediaType: media.mediaType, isPrimary: media.isPrimary };
    }

    async deleteMedia(mediaId: string): Promise<void> {
        await this.prisma.image.delete({ where: { id: mediaId } });
    }

    async setPrimary(itemId: string, imageId: string, _userId: string): Promise<void> {
        await this.prisma.$transaction(async (tx: any) => {
            await tx.image.updateMany({ where: { targetId: itemId, type: 'ITEM', mediaType: MediaType.IMAGE }, data: { isPrimary: false } });
            await tx.image.update({ where: { id: imageId }, data: { isPrimary: true } });
        });
    }
}


