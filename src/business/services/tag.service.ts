import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { TagTargetType } from "../../../generated/prisma";
import { ITagService } from "../interfaces/item.interfaces";
import { CreateTagRequest, ITagRepository, PopularTagResult, TagMasterData } from "../interfaces/tag.interfaces";
import { Logger } from "@utils/logger";

@injectable()
export class TagService implements ITagService {
  constructor(
    @inject(TYPES.TagRepository) private tagRepository: ITagRepository
  ) { }

  /**
   * Process tags for an item - create tags, links, and update usage
   */
  async processItemTags(itemId: string, tagNames: string[]): Promise<void> {
    if (!tagNames || tagNames.length === 0) {
      return;
    }

    // Clean and validate tags
    const cleanTags = tagNames
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .slice(0, 3); // Maximum 3 tags

    if (cleanTags.length === 0) {
      return;
    }

    // Use transaction to ensure atomicity
    await this.tagRepository.executeTransaction(async (repo) => {
      // 1. Remove existing tag links for this item
      await repo.deleteTagLinksForTarget(itemId, TagTargetType.ITEM);

      // 2. Process each tag
      for (const tagName of cleanTags) {
        // Find existing tag or create new one
        let tag = await repo.findTagByName(tagName);

        if (!tag) {
          tag = await repo.createTag(tagName);
        }

        // Create tag link
        await repo.createTagLink(tag.id, itemId, TagTargetType.ITEM);

        // Update or create tag usage
        const existingUsage = await repo.findTagUsage(tag.id, TagTargetType.ITEM);

        if (existingUsage) {
          await repo.incrementTagUsage(existingUsage.id);
        } else {
          await repo.createTagUsage(tag.id, TagTargetType.ITEM, 1);
        }
      }
    });
  }

  /**
   * Update item tags with differential logic
   */
  async updateItemTags(itemId: string, newTagNames: string[]): Promise<void> {
    if (!newTagNames) {
      newTagNames = [];
    }

    // Clean and validate new tags
    const cleanNewTags = newTagNames
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .slice(0, 3); // Maximum 3 tags

    // Use transaction to ensure atomicity
    await this.tagRepository.executeTransaction(async (repo) => {
      // 1. Get current tags for the item
      const currentTagNames = await repo.getTagNamesForTarget(itemId, TagTargetType.ITEM);

      // 2. Determine tags to add and remove
      const tagsToAdd = cleanNewTags.filter(tag => !currentTagNames.includes(tag));
      const tagsToRemove = currentTagNames.filter(tag => !cleanNewTags.includes(tag));

      // 3. Remove unused tags and decrement usage
      for (const tagName of tagsToRemove) {
        const tag = await repo.findTagByName(tagName);
        if (tag) {
          // Remove tag links for this specific tag
          const tagLinks = await repo.findTagLinksForTarget(itemId, TagTargetType.ITEM);
          const linkToRemove = tagLinks.find(link => link.tagId === tag.id);
          if (linkToRemove) {
            // Delete specific tag link through repository
            await repo.deleteTagLinksForSpecificTag(tag.id, itemId, TagTargetType.ITEM);
          }

          // Decrement usage or remove if count reaches 0
          const existingUsage = await repo.findTagUsage(tag.id, TagTargetType.ITEM);
          if (existingUsage) {
            if (existingUsage.usageCount <= 1) {
              // Remove usage record if count would be 0
              await repo.deleteTagUsageById(existingUsage.id);
            } else {
              // Decrement usage count
              await repo.decrementTagUsage(existingUsage.id);
            }
          }
        }
      }

      // 4. Add new tags and increment usage
      for (const tagName of tagsToAdd) {
        // Find existing tag or create new one
        let tag = await repo.findTagByName(tagName);

        if (!tag) {
          tag = await repo.createTag(tagName);
        }

        // Create tag link
        await repo.createTagLink(tag.id, itemId, TagTargetType.ITEM);

        // Update or create tag usage
        const existingUsage = await repo.findTagUsage(tag.id, TagTargetType.ITEM);

        if (existingUsage) {
          await repo.incrementTagUsage(existingUsage.id);
        } else {
          await repo.createTagUsage(tag.id, TagTargetType.ITEM, 1);
        }
      }
    });
  }

  /**
   * Get tags for a specific item
   */
  async getItemTags(itemId: string): Promise<string[]> {
    return await this.tagRepository.getTagNamesForTarget(itemId, TagTargetType.ITEM);
  }

  /**
   * Get popular tags for items
   */
  async getPopularTags(limit: number = 10): Promise<PopularTagResult[]> {
    return await this.tagRepository.findPopularTags(TagTargetType.ITEM, limit);
  }

  /**
   * Search tags by name pattern
   */
  async searchTags(query: string, _limit: number = 5): Promise<string[]> {
    // This would need a new repository method for fuzzy search
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Clean up unused tags
   */
  async cleanupUnusedTags(): Promise<void> {
    const unusedTags = await this.tagRepository.findUnusedTags();

    if (unusedTags.length > 0) {
      const tagIds = unusedTags.map(tag => tag.id);
      await this.tagRepository.deleteTagUsageByTagIds(tagIds);
      await this.tagRepository.deleteTagsByIds(tagIds);
    }
  }


  /**
   * Create a new tag
   */
  async createTagMaster(request: CreateTagRequest): Promise<TagMasterData> {
    const { name, tagLinks = [], TagUsage = [] } = request;

    Logger.info("Creating new tag", { name, tagLinksCount: tagLinks.length, tagUsageCount: TagUsage.length });

    this.validateCreateTagRequest(request);

    const existing = await this.tagRepository.findTagByName(name);
    if (existing) {
      throw new Error(`Tag name "${name}" already exists`);
    }
    const tagData = {
      name,
      tagLinks,
      TagUsage,
    };

    const newtag = await this.tagRepository.createTagmaster(tagData);

    Logger.info("Tag created successfully", { tagId: newtag.id, name: newtag.name });
    return newtag;
  }

  private validateCreateTagRequest(request: CreateTagRequest) {
    if (!request.name || request.name.trim().length === 0) {
      throw new Error("Tag name is required");
    }
    if (request.tagLinks) {
      for (const l of request.tagLinks) {
        if (!l?.id) throw new Error("Each tagLinks item must include an id");
        // if needed: if (!isUuid(l.id)) throw new Error("Invalid TagLink id format");
      }
    }

    if (request.TagUsage) {
      for (const u of request.TagUsage) {
        if (!u?.id) throw new Error("Each TagUsage item must include an id");
        // if needed: if (!isUuid(u.id)) throw new Error("Invalid TagUsage id format");
      }
    }
  }


}