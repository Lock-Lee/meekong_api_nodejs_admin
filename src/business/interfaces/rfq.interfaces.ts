import { RFQ, RFQImage, RFQQuotation, RFQOrder, RFQSize, RFQStatus, ItemType } from "../../../generated/prisma";
import { Decimal } from "@prisma/client/runtime/library";

// Base RFQ Data Type
export interface RFQData extends RFQ {
    images?: RFQImage[];
    sizes?: RFQSize[];
    quotations?: RFQQuotation[];
    orders?: RFQOrder[];
    category?: {
        id: string;
        nameTh: string;
        nameEn: string;
    };
    brand?: {
        id: string;
        nameTh: string;
        nameEn: string;
    };
    requester?: {
        id: string;
        email: string;
        profile?: {
            firstName: string;
            lastName: string;
        };
    };
}

// Create RFQ Request
export interface CreateRFQRequest {
    nameTh: string;
    nameEn: string;
    description: string;
    itemType: ItemType;
    minBudget?: Decimal;
    maxBudget?: Decimal;
    quantity: number;
    categoryId?: string;
    brandId?: string;
    requesterId: string;
    expireAt?: Date;
    imageUrl?: string;
    images?: string[]; // Array of image URLs
    sizes?: CreateRFQSizeRequest[];
}

// Create RFQ Size Request
export interface CreateRFQSizeRequest {
    sizeUnitId: string;
    value: string;
}

// Update RFQ Request
export interface UpdateRFQRequest {
    nameTh?: string;
    nameEn?: string;
    description?: string;
    itemType?: ItemType;
    minBudget?: Decimal;
    maxBudget?: Decimal;
    quantity?: number;
    categoryId?: string;
    brandId?: string;
    expireAt?: Date;
    status?: RFQStatus;
    imageUrl?: string;
    images?: string[];
    sizes?: CreateRFQSizeRequest[];
}

// Search RFQ Request
export interface SearchRFQRequest {
    page?: number;
    pageSize?: number;
    status?: RFQStatus;
    categoryId?: string;
    brandId?: string;
    requesterId?: string;
    minBudget?: Decimal;
    maxBudget?: Decimal;
    itemType?: ItemType;
    search?: string; // Search in nameTh, nameEn, description
}

// RFQ List Result
export interface RFQListResult {
    rfqs: RFQData[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// Create Quotation Request
export interface CreateQuotationRequest {
    rfqId: string;
    sellerId: string;
    itemPrice: Decimal;
    itemId?: string;
    itemVariantId?: string;
    productName?: string;
    productDescription?: string;
    productImages?: string;
    expireAt?: Date;
}

// Quotation Data
export interface QuotationData extends RFQQuotation {
    seller?: {
        id: string;
        email: string;
        profile?: {
            firstName: string;
            lastName: string;
        };
    };
    rfq?: {
        id: string;
        nameTh: string;
        nameEn: string;
    };
}

// Create RFQ Order Request
export interface CreateRFQOrderRequest {
    rfqId: string;
    quotationId: string;
    buyerId: string;
    sellerId: string;
    quantity: number;
    unitPrice: Decimal;
    subtotal: Decimal;
    shippingCost?: Decimal;
    commissionRate?: Decimal;
    commissionFee?: Decimal;
    totalAmount: Decimal;
    itemId?: string;
    itemVariantId?: string;
    productName?: string;
    productDescription?: string;
    productImages?: string;
    specialConditions?: string;
}

// RFQ Order Data
export interface RFQOrderData extends RFQOrder {
    buyer?: {
        id: string;
        email: string;
        profile?: {
            firstName: string;
            lastName: string;
        };
    };
    seller?: {
        id: string;
        email: string;
        profile?: {
            firstName: string;
            lastName: string;
        };
    };
    rfq?: {
        id: string;
        nameTh: string;
        nameEn: string;
    };
    quotation?: QuotationData;
}

// Repository Interface
export interface IRFQRepository {
    // RFQ CRUD
    createRFQ(data: Omit<RFQData, 'id' | 'createdAt' | 'updatedAt'>): Promise<RFQData>;
    findRFQById(id: string): Promise<RFQData | null>;
    findRFQs(request: SearchRFQRequest): Promise<{ rfqs: RFQData[]; total: number }>;
    updateRFQ(id: string, data: Partial<RFQData>): Promise<RFQData>;
    deleteRFQ(id: string): Promise<void>;

    // RFQ Images
    addRFQImages(rfqId: string, imageUrls: string[]): Promise<RFQImage[]>;
    removeRFQImages(rfqId: string, imageIds?: string[]): Promise<void>;

    // RFQ Sizes
    addRFQSizes(rfqId: string, sizes: CreateRFQSizeRequest[]): Promise<RFQSize[]>;
    updateRFQSizes(rfqId: string, sizes: CreateRFQSizeRequest[]): Promise<RFQSize[]>;

    // Quotations
    createQuotation(data: Omit<RFQQuotation, 'id' | 'createdAt' | 'updatedAt'>): Promise<QuotationData>;
    findQuotationsByRFQ(rfqId: string): Promise<QuotationData[]>;
    findQuotationById(id: string): Promise<QuotationData | null>;
    updateQuotation(id: string, data: Partial<RFQQuotation>): Promise<QuotationData>;
    deleteQuotation(id: string): Promise<void>;

    // Orders
    createRFQOrder(data: Omit<RFQOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<RFQOrderData>;
    findRFQOrderById(id: string): Promise<RFQOrderData | null>;
    findRFQOrdersByBuyer(buyerId: string): Promise<RFQOrderData[]>;
    findRFQOrdersBySeller(sellerId: string): Promise<RFQOrderData[]>;
    updateRFQOrder(id: string, data: Partial<RFQOrder>): Promise<RFQOrderData>;
}

// Service Interface
export interface IRFQService {
    // RFQ CRUD
    createRFQ(request: CreateRFQRequest): Promise<RFQData>;
    getRFQById(id: string): Promise<RFQData | null>;
    searchRFQs(request: SearchRFQRequest): Promise<RFQListResult>;
    updateRFQ(id: string, request: UpdateRFQRequest): Promise<RFQData>;
    deleteRFQ(id: string): Promise<void>;

    // My RFQs
    getMyRFQs(requesterId: string, page?: number): Promise<RFQListResult>;

    // Quotations
    submitQuotation(request: CreateQuotationRequest): Promise<QuotationData>;
    getQuotationsForRFQ(rfqId: string): Promise<QuotationData[]>;
    getMyQuotations(sellerId: string): Promise<QuotationData[]>;
    updateQuotation(id: string, data: Partial<RFQQuotation>): Promise<QuotationData>;
    deleteQuotation(id: string): Promise<void>;

    // Orders
    createOrderFromQuotation(request: CreateRFQOrderRequest): Promise<RFQOrderData>;
    getMyRFQOrders(userId: string, type: 'buyer' | 'seller'): Promise<RFQOrderData[]>;
    getRFQOrderById(id: string): Promise<RFQOrderData | null>;
    updateRFQOrder(id: string, data: Partial<RFQOrder>): Promise<RFQOrderData>;
}