

export interface BuyerAddressData {
    id: string;
    userId: string;
    label: string;
    fullName: string;
    phone: string;
    address: string;
    subDistrict: string;
    district: string;
    province: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
    latitude?: number;
    longitude?: number;
}

export interface CreateBuyerAddressData {
    id: string;
    userId: string;
    label: string;
    fullName: string;
    phone: string;
    address: string;
    subDistrict: string;
    district: string;
    province: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
    latitude?: number;
    longitude?: number;
}

export interface AddressesData {
    province: string;
    district: string;
    subdistrict: string;
    zipcode: string;
}

export interface IBuyerAddressRepository {
    findBuyerAddressByBuyerId(buyerId: string): Promise<BuyerAddressData[]>
    findBuyerAddressById(id: string): Promise<BuyerAddressData | null>
    createBuyerAddress(data: CreateBuyerAddressData): Promise<BuyerAddressData>
    updateBuyerAddress(id: string, data: CreateBuyerAddressData): Promise<BuyerAddressData>
    deleteBuyerAddress(id: string): Promise<void>
    findBuyerAddressBySearchText(searchText: string , page: number, limit: number): Promise<AddressesData[]>
}
export interface IBuyerAddressService {
    getAllBuyerAddress(buyerId: string): Promise<BuyerAddressData[]>;
    getBuyerAddressById(id: string): Promise<BuyerAddressData | null>;
    createBuyerAddress(data: CreateBuyerAddressData): Promise<BuyerAddressData>;
    updateBuyerAddress(id: string, data: CreateBuyerAddressData): Promise<BuyerAddressData>;
    deleteBuyerAddress(id: string): Promise<void>;
    searchAddresses(searchText: string, page: number, limit: number): Promise<AddressesData[]>;
}
