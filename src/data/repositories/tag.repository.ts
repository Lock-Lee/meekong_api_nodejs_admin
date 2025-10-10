import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { TagTargetType } from "../../../generated/prisma";
import {
    ITagRepository,
    TagData,
    TagLinkData,
    TagUsageData,
    PopularTagResult,
    CreateTagRequest,
    TagMasterData
} from "../../business/interfaces/tag.interfaces";

@injectable()
export class TagRepository implements ITagRepository {
    constructor(
        @inject(TYPES.PrismaClient) private prisma: any
    ) { }
    async getAlltag(): Promise<TagData[] | null> {
        const tag = await this.prisma.tag.findMany();
        return tag || null
    }
    /**
     * Create a new tag
     */
    async createTagmaster(data: CreateTagRequest): Promise<TagMasterData> {
        const { name, tagLinks = [], TagUsage = [] } = data;


        const tag = await this.prisma.tag.create({
            data: {
                name,
                ...(tagLinks.length
                    ? { tagLinks: { connect: tagLinks.map(t => ({ id: t.id })) } }
                    : {}),
                ...(TagUsage.length
                    ? { tagUsages: { connect: TagUsage.map(u => ({ id: u.id })) } }
                    : {}),
            },
            include: {
                tagLinks: { select: { id: true } },
                tagUsages: { select: { id: true } },
            },
        });

        return this.mapToTagMasterData(tag);

    }

    /**
     * Find tag by name
     */
    async findTagByName(name: string): Promise<TagData | null> {
        const tag = await this.prisma.tag.findUnique({
            where: { name }
        });
        return tag ? this.mapToTagData(tag) : null;
    }

    /**
     * Find tag by ID
     */
    async findTagById(id: string): Promise<TagData | null> {
        const tag = await this.prisma.tag.findUnique({
            where: { id }
        });
        return tag ? this.mapToTagData(tag) : null;
    }

    /**
     * Create a new tag
     */
    async createTag(name: string): Promise<TagData> {
        const tag = await this.prisma.tag.create({
            data: { name }
        });
        return this.mapToTagData(tag);
    }

    /**
     * Find unused tags (tags with no usage records)
     */
    async findUnusedTags(): Promise<TagData[]> {
        const tags = await this.prisma.tag.findMany({
            where: {
                tagUsages: {
                    none: {}
                }
            }
        });
        return tags.map((tag: any) => this.mapToTagData(tag));
    }

    /**
     * Delete tags by IDs
     */
    async deleteTagsByIds(tagIds: string[]): Promise<void> {
        await this.prisma.tag.deleteMany({
            where: {
                id: { in: tagIds }
            }
        });
    }

    /**
     * Delete all tag links for a target
     */
    async deleteTagLinksForTarget(targetId: string, targetType: TagTargetType): Promise<void> {
        await this.prisma.tagLink.deleteMany({
            where: {
                targetId,
                targetType
            }
        });
    }

    /**
     * Delete specific tag link for a tag and target
     */
    async deleteTagLinksForSpecificTag(tagId: string, targetId: string, targetType: TagTargetType): Promise<void> {
        await this.prisma.tagLink.deleteMany({
            where: {
                tagId,
                targetId,
                targetType
            }
        });
    }

    /**
     * Create a tag link
     */
    async createTagLink(tagId: string, targetId: string, targetType: TagTargetType): Promise<TagLinkData> {
        const tagLink = await this.prisma.tagLink.create({
            data: {
                tagId,
                targetId,
                targetType
            }
        });
        return this.mapToTagLinkData(tagLink);
    }

    /**
     * Find tag links for a target
     */
    async findTagLinksForTarget(targetId: string, targetType: TagTargetType): Promise<TagLinkData[]> {
        const tagLinks = await this.prisma.tagLink.findMany({
            where: {
                targetId,
                targetType
            }
        });
        return tagLinks.map((link: any) => this.mapToTagLinkData(link));
    }

    /**
     * Get tag names for a target with a single query
     */
    async getTagNamesForTarget(targetId: string, targetType: TagTargetType): Promise<string[]> {
        const tagLinks = await this.prisma.tagLink.findMany({
            where: {
                targetId,
                targetType
            },
            include: {
                tag: true
            }
        });
        return tagLinks.map((link: any) => link.tag.name);
    }

    /**
     * Find tag usage record
     */
    async findTagUsage(tagId: string, targetType: TagTargetType): Promise<TagUsageData | null> {
        const usage = await this.prisma.tagUsage.findFirst({
            where: {
                tagId,
                targetType
            }
        });
        return usage ? this.mapToTagUsageData(usage) : null;
    }

    /**
     * Create tag usage record
     */
    async createTagUsage(tagId: string, targetType: TagTargetType, usageCount: number): Promise<TagUsageData> {
        const usage = await this.prisma.tagUsage.create({
            data: {
                tagId,
                targetType,
                count: usageCount,
                period: 'all-time',
                updatedAt: new Date()
            }
        });
        return this.mapToTagUsageData(usage);
    }

    /**
     * Increment tag usage count
     */
    async incrementTagUsage(usageId: string): Promise<TagUsageData> {
        const usage = await this.prisma.tagUsage.update({
            where: { id: usageId },
            data: { count: { increment: 1 } }
        });
        return this.mapToTagUsageData(usage);
    }

    /**
     * Decrement tag usage count
     */
    async decrementTagUsage(usageId: string): Promise<TagUsageData> {
        const usage = await this.prisma.tagUsage.update({
            where: { id: usageId },
            data: { count: { decrement: 1 } }
        });
        return this.mapToTagUsageData(usage);
    }

    /**
     * Delete tag usage by ID
     */
    async deleteTagUsageById(usageId: string): Promise<void> {
        await this.prisma.tagUsage.delete({
            where: { id: usageId }
        });
    }

    /**
     * Delete tag usage by tag IDs
     */
    async deleteTagUsageByTagIds(tagIds: string[]): Promise<void> {
        await this.prisma.tagUsage.deleteMany({
            where: {
                tagId: { in: tagIds }
            }
        });
    }

    /**
     * Find popular tags
     */
    async findPopularTags(targetType: TagTargetType, limit: number): Promise<PopularTagResult[]> {
        const popularTags = await this.prisma.tagUsage.findMany({
            where: { targetType },
            include: { tag: true },
            orderBy: { count: 'desc' },
            take: limit
        });

        return popularTags.map((usage: any) => ({
            tag: this.mapToTagData(usage.tag),
            usageCount: usage.count
        }));
    }

    /**
     * Execute operations in a transaction
     */
    async executeTransaction<T>(callback: (repository: ITagRepository) => Promise<T>): Promise<T> {
        return await this.prisma.$transaction(async (tx: any) => {
            const transactionRepo = new TagRepository(tx);
            return await callback(transactionRepo);
        });
    }

    // Mappers
    private mapToTagData(tag: any): TagData {
        return {
            id: tag.id,
            name: tag.name,
            createdAt: tag.createdAt,
            updatedAt: tag.updatedAt
        };
    }


    private mapToTagMasterData(tag: any): TagMasterData {
        return {
            id: tag.id,
            name: tag.name,
            createdById: tag.createdById ?? null,
            categoryId: tag.categoryId ?? null,
            tagLinks: tag.tagLinks.map((l: { id: string }) => ({ id: l.id })),
            tagUsages: tag.tagUsages.map((u: { id: string }) => ({ id: u.id })),
        };
    }

    private mapToTagLinkData(tagLink: any): TagLinkData {
        return {
            id: tagLink.id,
            tagId: tagLink.tagId,
            targetId: tagLink.targetId,
            targetType: tagLink.targetType,
            createdAt: tagLink.createdAt
        };
    }

    private mapToTagUsageData(usage: any): TagUsageData {
        return {
            id: usage.id,
            tagId: usage.tagId,
            targetType: usage.targetType,
            usageCount: usage.count,
            createdAt: usage.createdAt,
            updatedAt: usage.updatedAt
        };
    }
}
