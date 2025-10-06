import { UploadedFile } from "express-fileupload";


export interface CreateBuyerReportRequest {
    buyerId: string;
    itemId?: string;
    typeId: string;
    shopId?: string;
    reason: string;
    images: string[];
}

export interface BuyerReportData{
    id: string;
    buyerId: string;
    itemId?: string;
    typeId: string;
    shopId?: string;
    reason: string;
    images: string[];
    createdAt?: Date;
    user?: {
        id: string;
        profile: {
            avatarUrl: string;
            firstName: string;
            lastName: string;
        };
    };
    shop?:{
        id: string;
        name: string;
    };
    item?:{
        id: string;
        code?: string;
        nameTh?: string;
        nameEn?: string;
        descriptionTh?: string;
        descriptionEn?: string;
        images?: string[];
        imagesUrl?: string[];
    };
    type?:{
        id: string;
        name: string;
    };
}
export interface FindBuyerReportParams {
    buyerId?: string;
    itemId?: string;
    typeId?: string;
    shopId?: string;
}

export interface UploadImageResult {
    imageUrl: string;
    filePath: string;
    imageId: string;
}

export interface IBuyerReportRepository {
    createBuyerReport(data: CreateBuyerReportRequest ): Promise<BuyerReportData >;
    findBuyerReport(params: FindBuyerReportParams): Promise<BuyerReportData[]>;
}

export interface IBuyerReportService {
    createBuyerReport(data: Omit<BuyerReportData, 'id' | 'createdAt' | 'images'> & { images?: UploadedFile | UploadedFile[] }) : Promise<BuyerReportData>;
    getBuyerReport(params: FindBuyerReportParams): Promise<BuyerReportData[]>;
}
