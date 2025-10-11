import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { Status } from "../../../generated/prisma";
import {
    ICategoryRepository,
    CategoryData,
    UpsertWorkItem
} from "../../business/interfaces/category.interfaces";
import { Prisma } from "@prisma/client";

@injectable()
export class CategoryRepository implements ICategoryRepository {
    constructor(
        @inject(TYPES.PrismaClient) private prisma: any
    ) { }

    /**
     * Find all active categories
     */
    async findAllActiveCategories(): Promise<CategoryData[]> {
        const categories = await this.prisma.category.findMany({
            where: { status: Status.ACTIVE },
            orderBy: { nameTh: "asc" },
        });

        return categories.map((category: any) => this.mapToCategoryData(category));
    }

    async findTopLevelCategories(): Promise<CategoryData[]> {
        const categories = await this.prisma.category.findMany({
            where: {
                status: Status.ACTIVE,
                level: 1,
            },
            orderBy: { nameTh: "asc" },
            include: {
                tag: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                items: {
                    select: {
                        id: true,
                        nameTh: true,
                        nameEn: true
                    }
                },
                children: {
                    where: { status: Status.ACTIVE },
                    select: {
                        id: true,
                        nameTh: true,
                        nameEn: true,
                        imageUrl: true,
                        level: true,
                        fullPath: true,
                        tag: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                        items: {
                            select: {
                                id: true,
                                nameTh: true,
                                nameEn: true
                            }
                        },
                        children: {
                            where: { status: Status.ACTIVE },
                            select: {
                                id: true,
                                nameTh: true,
                                nameEn: true,
                                imageUrl: true,
                                level: true,
                                fullPath: true,
                                tag: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                },
                                items: {
                                    select: {
                                        id: true,
                                        nameTh: true,
                                        nameEn: true
                                    }
                                },
                                children: {
                                    where: { status: Status.ACTIVE },
                                    select: {
                                        id: true,
                                        nameTh: true,
                                        nameEn: true,
                                        imageUrl: true,
                                        level: true,
                                        fullPath: true,
                                    },
                                    orderBy: { nameTh: "asc" },
                                },
                            },
                            orderBy: { nameTh: "asc" },
                        },
                    },
                    orderBy: { nameTh: "asc" },
                },
            },
        })
        return categories.map((category: any) => this.mapToCategoryDataWithChildren(category))
    }


    /**
     * Find top-level categories with children hierarchy
     */
    async findTopLevelCategorieswithpage(page: number, pageSize: number): Promise<{ category: CategoryData[]; total: number }> {
        const skip = (page - 1) * pageSize;
        const [categories, total] = await this.prisma.$transaction([this.prisma.category.findMany({
            take: pageSize,
            skip,
            where: {
                status: Status.ACTIVE,
                level: 1,
            },
            orderBy: { nameTh: "asc" },
            include: {
                tag: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                items: {
                    select: {
                        id: true,
                        nameTh: true,
                        nameEn: true
                    }
                },
                children: {
                    where: { status: Status.ACTIVE },
                    select: {
                        id: true,
                        nameTh: true,
                        nameEn: true,
                        imageUrl: true,
                        level: true,
                        fullPath: true,
                        tag: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                        items: {
                            select: {
                                id: true,
                                nameTh: true,
                                nameEn: true
                            }
                        },
                        children: {
                            where: { status: Status.ACTIVE },
                            select: {
                                id: true,
                                nameTh: true,
                                nameEn: true,
                                imageUrl: true,
                                level: true,
                                fullPath: true,
                                tag: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                },
                                items: {
                                    select: {
                                        id: true,
                                        nameTh: true,
                                        nameEn: true
                                    }
                                },
                                children: {
                                    where: { status: Status.ACTIVE },
                                    select: {
                                        id: true,
                                        nameTh: true,
                                        nameEn: true,
                                        imageUrl: true,
                                        level: true,
                                        fullPath: true,
                                    },
                                    orderBy: { nameTh: "asc" },
                                },
                            },
                            orderBy: { nameTh: "asc" },
                        },
                    },
                    orderBy: { nameTh: "asc" },
                },
            },
        }), this.prisma.category.count({
            where: {
                status: Status.ACTIVE,
                level: 1,
            }
        })]);
        return { category: categories.map((category: any) => this.mapToCategoryDataWithChildren(category)), total }
    }


    async findChildrenTreeByParentIdwithpage(page: number, pageSize: number, parentId: string | null): Promise<{ category: CategoryData[]; total: number }> {
        const skip = (page - 1) * pageSize;
        const [categories, total] = await this.prisma.$transaction([this.prisma.category.findMany({
            take: pageSize,
            skip,
            where: { status: Status.ACTIVE, parentId },
            orderBy: { nameTh: "asc" },
            select: {
                id: true, nameTh: true, nameEn: true, imageUrl: true, level: true, fullPath: true,
                children: {
                    where: { status: Status.ACTIVE },
                    orderBy: { nameTh: "asc" },
                    select: {
                        id: true, nameTh: true, nameEn: true, imageUrl: true, level: true, fullPath: true,
                        children: {
                            where: { status: Status.ACTIVE },
                            orderBy: { nameTh: "asc" },
                            select: { id: true, nameTh: true, nameEn: true, imageUrl: true, level: true, fullPath: true },
                        },
                    },
                },
            },
        }), this.prisma.category.count({
            where: { status: Status.ACTIVE, parentId },
        })]);

        return { category: categories.map((category: any) => this.mapToCategoryDataWithChildren(category)), total }
    }

    async findChildrenTreeByParentId(parentId: string | null): Promise<CategoryData[]> {
        const categories = await this.prisma.category.findMany({

            where: { status: Status.ACTIVE, parentId },
            orderBy: { nameTh: "asc" },
            select: {
                id: true, nameTh: true, nameEn: true, imageUrl: true, level: true, fullPath: true,
                children: {
                    where: { status: Status.ACTIVE },
                    orderBy: { nameTh: "asc" },
                    select: {
                        id: true, nameTh: true, nameEn: true, imageUrl: true, level: true, fullPath: true,
                        children: {
                            where: { status: Status.ACTIVE },
                            orderBy: { nameTh: "asc" },
                            select: { id: true, nameTh: true, nameEn: true, imageUrl: true, level: true, fullPath: true },
                        },
                    },
                },
            },
        })
        return categories.map((category: any) => this.mapToCategoryDataWithChildren(category))
    }

    /**
     * Find category by ID
     */
    async findCategoryById(id: string): Promise<CategoryData | null> {
        const category = await this.prisma.category.findUnique({
            where: {
                id,
                status: Status.ACTIVE
            },
        });

        return category ? this.mapToCategoryData(category) : null;
    }

    /**
     * Find category with children by ID
     */
    async findCategoryWithChildren(id: string): Promise<CategoryData | null> {
        const category = await this.prisma.category.findUnique({
            where: {
                id,
                status: Status.ACTIVE
            },
            include: {
                children: {
                    where: { status: Status.ACTIVE },
                    select: {
                        id: true,
                        nameTh: true,
                        nameEn: true,
                        imageUrl: true,
                        level: true,
                        fullPath: true,
                        isLeaf: true,
                        status: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                    orderBy: { nameTh: "asc" },
                },
            },
        });
        return category ? this.mapToCategoryDataWithChildren(category) : null;
    }

    async findCategoryWithSizeUnit(id: string): Promise<CategoryData | null> {
        const category = await this.prisma.category.findUnique({
            include: {
                sizeUnitCategory: {
                    select: {
                        id: true,
                        name: true,
                        unitSymbol: true,
                        type: true,
                        status: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }
            },
            where: {
                id,
                status: Status.ACTIVE
            },
        });
        return category || null
    }

    async findCategoryWithTags(id: string): Promise<CategoryData | null> {
        const category = await this.prisma.category.findUnique({
            include: {
                tag: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        createdBy: true,
                    }
                }
            },
            where: {
                id,
                status: Status.ACTIVE
            },
        });
        return category || null
    }



    async findCategoryWithSizeUnitId(id: string, sizeUnitId: string): Promise<CategoryData | null> {
        const sizeUnit = await this.prisma.SizeUnit.findFirst({
            select: {
                id: true,
                name: true,
                unitSymbol: true,
                type: true,
                status: true,
                createdAt: true,
                updatedAt: true
            },
            where: {
                id: sizeUnitId,
                status: Status.ACTIVE,
                category: {
                    id: id,
                },
            },
        })
        return sizeUnit || null
    }

    /**
     * Find categories by parent ID
     */
    async findCategoryByParentId(parentId: string): Promise<CategoryData[]> {
        const categories = await this.prisma.category.findMany({
            where: {
                parentId,
                status: Status.ACTIVE
            },
            orderBy: { nameTh: "asc" },
        });

        return categories.map((category: any) => this.mapToCategoryData(category));
    }

    /**
     * Create a new category
     */
    async createCategory(data: Omit<CategoryData, 'id' | 'createdAt' | 'updatedAt'>): Promise<CategoryData> {
        const category = await this.prisma.category.create({
            data: {
                nameTh: data.nameTh,
                nameEn: data.nameEn,
                imageUrl: data.imageUrl,
                level: data.level,
                parentId: data.parentId,
                fullPath: data.fullPath,
                isLeaf: data.isLeaf,
                status: data.status,
            },
        });

        return this.mapToCategoryData(category);
    }
    async createManyCategories(items: Array<{
        data: Omit<CategoryData, "id" | "createdAt" | "updatedAt">;
        parentId?: string | null;
    }>): Promise<CategoryData[]> {
        const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const createdRows: CategoryData[] = [];

            // Track which parents were leaf and must be set to false
            const parentsToUpdate = new Set<string>();

            for (const { data, parentId } of items) {
                const created = await tx.category.create({
                    data: {
                        nameTh: data.nameTh,
                        nameEn: data.nameEn,
                        imageUrl: data.imageUrl,
                        level: data.level,
                        parentId: data.parentId,
                        fullPath: data.fullPath,
                        isLeaf: data.isLeaf,
                        status: data.status,
                    },
                });

                createdRows.push(this.mapToCategoryData(created));

                if (parentId) {
                    // Check current isLeaf for this parent inside the same tx
                    const p = await tx.category.findUnique({
                        where: { id: parentId },
                        select: { id: true, isLeaf: true },
                    });
                    if (p?.isLeaf) {
                        parentsToUpdate.add(p.id);
                    }
                }
            }

            if (parentsToUpdate.size > 0) {
                await tx.category.updateMany({
                    where: { id: { in: Array.from(parentsToUpdate) } },
                    data: { isLeaf: false },
                });
            }

            return createdRows;
        });

        return result;
    }

    async assignTagsToCategory(categoryId: string, tagIds: string[]): Promise<number> {
        const result = await this.prisma.tag.updateMany({
            where: { id: { in: tagIds } },
            data: { categoryId },
        });
        return result.count;
    }

    async removeTagsfromCategory(categoryId: string): Promise<number> {
        const result = await this.prisma.tag.updateMany({
            where: { categoryId },
            data: { categoryId: null },
        });
        return result.count;
    }

    async replaceCategoryTags(categoryId: string, tagIds: string[] = []) {
        return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const removeRes = await tx.tag.updateMany({
                where: { categoryId },
                data: { categoryId: null },
            });

            let addResCount = 0;
            if (tagIds.length > 0) {
                const addRes = await tx.tag.updateMany({
                    where: { id: { in: tagIds } },
                    data: { categoryId },
                });
                addResCount = addRes.count;
            }

            return { removed: removeRes.count, added: addResCount };
        });
    }

    async replaceCategoryItems(
        categoryId: string,
        itemIds: string[]
    ): Promise<{ removed: number; added: number }> {
        return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const removeRes = await tx.item.updateMany({
                where: { categoryId },
                data: { categoryId: null },
            });

            let addResCount = 0;
            if (itemIds.length > 0) {
                const addRes = await tx.item.updateMany({
                    where: { id: { in: itemIds } },
                    data: { categoryId },
                });
                addResCount = addRes.count;
            }
            return { removed: removeRes.count, added: addResCount };
        });
    }


    async assignItemsToCategory(categoryId: string, itemsId: string[]): Promise<number> {
        const result = await this.prisma.item.updateMany({
            where: { id: { in: itemsId } },
            data: { categoryId },
        });
        return result.count;
    }

    async removeItemsfromCategory(categoryId: string): Promise<number> {
        const result = await this.prisma.item.updateMany({
            where: { categoryId },
            data: { categoryId: null },
        });
        return result.count;
    }



    async upsertManyCategories(items: UpsertWorkItem[]): Promise<CategoryData[]> {
        return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const rows: CategoryData[] = [];
            const parentsSetFalse = new Set<string>(); // parents that must be false (have at least one child)
            const parentsMaybeTrue = new Set<string>(); // old parents that might become leaf again

            for (const it of items) {
                if (it.mode === "create") {
                    const created = await tx.category.create({
                        data: {
                            nameTh: it.data.nameTh,
                            nameEn: it.data.nameEn,
                            imageUrl: it.data.imageUrl,
                            level: it.data.level,
                            parentId: it.data.parentId ?? undefined,
                            fullPath: it.data.fullPath,
                            isLeaf: it.data.isLeaf,
                            status: it.data.status,
                        },
                    });
                    rows.push(this.mapToCategoryData(created));

                    if (it.parentId) parentsSetFalse.add(it.parentId);
                } else {
                    // UPDATE path
                    if (!it.id) throw new Error("Missing id for update item");

                    const updated = await tx.category.update({
                        where: { id: it.id },
                        data: {
                            nameTh: it.data.nameTh,
                            nameEn: it.data.nameEn,
                            imageUrl: it.data.imageUrl,
                            level: it.data.level,
                            parentId: it.data.parentId ?? undefined,
                            fullPath: it.data.fullPath,
                            isLeaf: it.data.isLeaf,
                            status: it.data.status,
                        },
                    });
                    rows.push(this.mapToCategoryData(updated));

                    // parent leaf maintenance
                    const newParentId = it.parentId ?? null;
                    const oldParentId = it.oldParentId ?? null;

                    if (newParentId && newParentId !== oldParentId) {
                        parentsSetFalse.add(newParentId);
                        if (oldParentId) parentsMaybeTrue.add(oldParentId);
                    }
                }
            }

            // Set all "parentsSetFalse" to isLeaf=false
            if (parentsSetFalse.size) {
                await tx.category.updateMany({
                    where: { id: { in: Array.from(parentsSetFalse) } },
                    data: { isLeaf: false },
                });
            }

            // For old parents that might become leaf again, check if they still have children
            if (parentsMaybeTrue.size) {
                const ids = Array.from(parentsMaybeTrue);
                for (const pid of ids) {
                    const childCount = await tx.category.count({ where: { parentId: pid } });
                    if (childCount === 0) {
                        await tx.category.update({ where: { id: pid }, data: { isLeaf: true } });
                    }
                }
            }

            return rows;
        });
    }

    async updateCategory(id: string, data: Omit<CategoryData, 'id' | 'createdAt' | 'updatedAt' | 'tag' | 'items'>): Promise<CategoryData> {
        const category = await this.prisma.category.update({
            data: {
                nameTh: data.nameTh,
                nameEn: data.nameEn,
                imageUrl: data.imageUrl,
                level: data.level,
                parentId: data.parentId,
                fullPath: data.fullPath,
                isLeaf: data.isLeaf,
                status: data.status,
            },
            where: {
                id: id
            }
        });

        return this.mapToCategoryData(category);
    }

    async deleteCategory(id: string): Promise<CategoryData> {
        const category = await this.prisma.category.delete({
            where: {
                id: id
            }
        });

        return this.mapToCategoryData(category);
    }


    /**
     * Update category leaf status
     */
    async updateCategoryLeafStatus(categoryId: string, isLeaf: boolean): Promise<void> {
        await this.prisma.category.update({
            where: { id: categoryId },
            data: { isLeaf },
        });
    }

    // Mappers
    private mapToCategoryData(category: any): CategoryData {
        return {
            id: category.id,
            nameTh: category.nameTh,
            nameEn: category.nameEn,
            imageUrl: category.imageUrl,
            level: category.level,
            parentId: category.parentId,
            fullPath: category.fullPath || [],
            isLeaf: category.isLeaf,
            status: category.status,
            tag: category.tag,
            items: category.items,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        };
    }

    private mapToCategoryDataWithChildren(category: any): CategoryData {
        const baseData = this.mapToCategoryData(category);
        if (category.children) {
            baseData.children = category.children.map((child: any) =>
                this.mapToCategoryDataWithChildren(child)
            );
        }

        return baseData;
    }
}
