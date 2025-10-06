import { SizeUnitType } from "../../../generated/prisma"

export interface SizeUnitData {
    id: string;
    name: string;
    unitSymbol: string | null;
    categoryId: string | null;
    type: SizeUnitType;
    status: string | null;
    category: {
        id: string;
        nameTh: string;
        nameEn: string;
        level: number;
        fullPath: string[];
    };
}


export interface ISizeUnitRepository {
    findSizeUnitByCategory(categoryId: string): Promise<SizeUnitData[]>;
}

export interface ISizeUnitService {
    getSizeUnitByCategory(categoryId: string): Promise<SizeUnitData[]>;
}
