import { ISizeUnitRepository, SizeUnitData } from "../../business/interfaces/size-unit.interfaces";
import { inject, injectable } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { PrismaClient } from "@prisma/client";


@injectable()
export class SizeUnitRepository implements ISizeUnitRepository {

    private prisma: PrismaClient;

    constructor(
        @inject(TYPES.PrismaClient) prisma: PrismaClient
    ) {
        this.prisma = prisma;
    }

    private mapToSizeUnitData(sizeUnit: any): SizeUnitData {
        return {
            id: sizeUnit.id,
            name: sizeUnit.name,
            unitSymbol: sizeUnit.unitSymbol || null,
            categoryId: sizeUnit.categoryId || null,
            type: sizeUnit.type,
            status: sizeUnit.status,
            category: sizeUnit.category || null,
        };
    }

    async findSizeUnitByCategory(categoryId: string): Promise<SizeUnitData[]> {
        const sizeUnits = await this.prisma.sizeUnit.findMany({ 
            where: { 
                ...(categoryId && { categoryId }),
                status:'ACTIVE'
            },
            include: {
                category: {
                  select: {
                    id: true,
                    nameTh: true,
                    nameEn: true,
                    level: true,
                    fullPath: true,
                  },
                },
            },
        });
        return sizeUnits.map((u: any) => this.mapToSizeUnitData(u));
    }


}
