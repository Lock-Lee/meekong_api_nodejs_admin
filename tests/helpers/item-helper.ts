import { PrismaClient } from '../../generated/prisma';
import { TestUser } from './auth-helper';

const prisma = new PrismaClient();

export interface TestItem {
    id: string;
    nameTh: string;
    nameEn: string;
    sellerId: string;
}

export async function createTestItem(user: TestUser, overrides: Partial<any> = {}): Promise<TestItem> {
    const categoryId = await getOrCreateTestCategory();
    const brandId = await getOrCreateTestBrand();

    const item = await prisma.item.create({
        data: {
            code: `TEST-ITEM-${Date.now()}`, // Unique item code
            nameTh: 'Test Item TH',
            nameEn: 'Test Item EN',
            descriptionTh: 'Test Description TH',
            descriptionEn: 'Test Description EN',
            itemType: 'NEW',
            sellType: 'NORMAL',
            categoryId,
            brandId,
            sellerId: user.id, // Changed from createdById to sellerId
            ...overrides
        }
    });

    return {
        id: item.id,
        nameTh: item.nameTh,
        nameEn: item.nameEn,
        sellerId: item.sellerId
    };
}

async function getOrCreateTestCategory(): Promise<string> {
    let category = await prisma.category.findFirst({
        where: { nameEn: 'Test Category' }
    });

    if (!category) {
        category = await prisma.category.create({
            data: {
                nameTh: 'หมวดทดสอบ',
                nameEn: 'Test Category',
                level: 1 // Required field in the schema
            }
        });
    }

    return category.id;
}

async function getOrCreateTestBrand(): Promise<string> {
    let brand = await prisma.brand.findFirst({
        where: { nameEn: 'Test Brand' }
    });

    if (!brand) {
        brand = await prisma.brand.create({
            data: {
                nameTh: 'แบรนด์ทดสอบ',
                nameEn: 'Test Brand'
            }
        });
    }

    return brand.id;
}

export async function cleanupTestItems(): Promise<void> {
    await prisma.image.deleteMany();
    await prisma.item.deleteMany();
}
