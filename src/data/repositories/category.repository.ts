import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { Status } from "../../../generated/prisma";
import {
    ICategoryRepository,
    CategoryData
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

    /**
     * Find top-level categories with children hierarchy
     */
    async findTopLevelCategories(): Promise<CategoryData[]> {
        const categories = await this.prisma.category.findMany({
            where: {
                status: Status.ACTIVE,
                level: 1,
            },
            orderBy: { nameTh: "asc" },
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
                        children: {
                            where: { status: Status.ACTIVE },
                            select: {
                                id: true,
                                nameTh: true,
                                nameEn: true,
                                imageUrl: true,
                                level: true,
                                fullPath: true,
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
        });

        return categories.map((category: any) => this.mapToCategoryDataWithChildren(category));
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

    async updateCategory(id: string, data: Omit<CategoryData, 'id' | 'createdAt' | 'updatedAt'>): Promise<CategoryData> {
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
