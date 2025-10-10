import { TagTargetType } from "../../../generated/prisma";

export interface TagData {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

export type TagMasterData = {
    id: string;
    name: string;
    createdById?: string | null;
    categoryId?: string | null;
    tagLinks: { id: string }[];
    tagUsages: { id: string }[];
};

export interface TagLinkData {
    id: string;
    tagId: string;
    targetId: string;
    targetType: TagTargetType;
    createdAt: Date;
}

export interface TagUsageData {
    id: string;
    tagId: string;
    targetType: TagTargetType;
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface PopularTagResult {
    tag: TagData;
    usageCount: number;
}

export interface CreateTagRequest {
    name: string;
    tagLinks?: { id: string }[];
    TagUsage?: { id: string }[];
}

/**
 * Repository interface for tag-related data operations
 */
export interface ITagRepository {
    // Tag operations
    getAlltag(): Promise<TagData[] | null>;
    findTagByName(name: string): Promise<TagData | null>;
    findTagById(id: string): Promise<TagData | null>;
    createTag(name: string): Promise<TagData>;
    createTagmaster(data: CreateTagRequest): Promise<TagMasterData>;
    findUnusedTags(): Promise<TagData[]>;
    deleteTagsByIds(tagIds: string[]): Promise<void>;

    // Tag link operations
    deleteTagLinksForTarget(targetId: string, targetType: TagTargetType): Promise<void>;
    deleteTagLinksForSpecificTag(tagId: string, targetId: string, targetType: TagTargetType): Promise<void>;
    createTagLink(tagId: string, targetId: string, targetType: TagTargetType): Promise<TagLinkData>;
    findTagLinksForTarget(targetId: string, targetType: TagTargetType): Promise<TagLinkData[]>;
    getTagNamesForTarget(targetId: string, targetType: TagTargetType): Promise<string[]>;

    // Tag usage operations
    findTagUsage(tagId: string, targetType: TagTargetType): Promise<TagUsageData | null>;
    createTagUsage(tagId: string, targetType: TagTargetType, usageCount: number): Promise<TagUsageData>;
    incrementTagUsage(usageId: string): Promise<TagUsageData>;
    decrementTagUsage(usageId: string): Promise<TagUsageData>;
    deleteTagUsageById(usageId: string): Promise<void>;
    deleteTagUsageByTagIds(tagIds: string[]): Promise<void>;
    findPopularTags(targetType: TagTargetType, limit: number): Promise<PopularTagResult[]>;

    // Transaction support
    executeTransaction<T>(callback: (repository: ITagRepository) => Promise<T>): Promise<T>;
}


export interface ITagMasterService {
    getAlltag(): Promise<TagMasterData[] | null>;
    getTagById(id: string): Promise<TagMasterData | null>;

    createTagMaster(request: CreateTagRequest): Promise<TagMasterData | null>;

}