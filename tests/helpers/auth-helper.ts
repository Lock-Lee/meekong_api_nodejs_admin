import jwt from 'jsonwebtoken';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export interface TestUser {
    id: string;
    email: string;
    accessToken: string;
}

export async function createTestUser(email: string = 'test@example.com'): Promise<TestUser> {
    // Create user in database
    const user = await prisma.user.create({
        data: {
            email
        }
    });

    // Create user profile separately
    await prisma.userProfile.create({
        data: {
            userId: user.id,
            firstName: 'Test',
            lastName: 'User'
        }
    });

    // Generate JWT token
    const accessToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
    );

    return {
        id: user.id,
        email: user.email,
        accessToken
    };
}

export async function createTestSeller(email: string = 'seller@example.com'): Promise<TestUser> {
    const user = await createTestUser(email);

    // Make user a seller by creating items
    await prisma.item.create({
        data: {
            code: `TEST-${Date.now()}`, // Unique item code
            nameTh: 'Test Product',
            nameEn: 'Test Product',
            descriptionTh: 'Test Description',
            descriptionEn: 'Test Description',
            itemType: 'NEW',
            sellType: 'NORMAL',
            categoryId: await getTestCategoryId(),
            brandId: await getTestBrandId(),
            sellerId: user.id // Changed from createdById to sellerId
        }
    });

    return user;
}

async function getTestCategoryId(): Promise<string> {
    let category = await prisma.category.findFirst();
    if (!category) {
        category = await prisma.category.create({
            data: {
                nameTh: 'Test Category',
                nameEn: 'Test Category',
                level: 1 // Required field in the schema
            }
        });
    }
    return category.id;
}

async function getTestBrandId(): Promise<string> {
    let brand = await prisma.brand.findFirst();
    if (!brand) {
        brand = await prisma.brand.create({
            data: {
                nameTh: 'Test Brand',
                nameEn: 'Test Brand'
            }
        });
    }
    return brand.id;
}

export async function cleanupTestUsers(): Promise<void> {
    await prisma.image.deleteMany();
    await prisma.item.deleteMany();
    await prisma.userProfile.deleteMany(); // Changed from profile to userProfile
    await prisma.user.deleteMany();
}
