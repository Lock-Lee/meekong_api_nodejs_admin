import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import {
    IBuyerAddressService,
    IBuyerAddressRepository,
    BuyerAddressData,
    CreateBuyerAddressData,
    AddressesData
} from "../interfaces/buyer-address.interfaces";
import { Logger } from "../../shared/utils/logger";


@injectable()
export class BuyerAddressService implements IBuyerAddressService {
    constructor(
        @inject(TYPES.BuyerAddressRepository) private buyerAddressRepository: IBuyerAddressRepository
    ) { }

    async getAllBuyerAddress(buyerId: string): Promise<BuyerAddressData[]> {
        Logger.info("Getting all buyer addresses", { buyerId });
        return this.buyerAddressRepository.findBuyerAddressByBuyerId(buyerId);
    }

    async getBuyerAddressById(id: string): Promise<BuyerAddressData | null> {
        Logger.info("Getting buyer address by id", { id });
        return this.buyerAddressRepository.findBuyerAddressById(id);
    }

    async createBuyerAddress(data: CreateBuyerAddressData): Promise<BuyerAddressData> {
        Logger.info("Creating buyer address", { data });
        return this.buyerAddressRepository.createBuyerAddress(data);
    }

    async updateBuyerAddress(id: string, data: CreateBuyerAddressData): Promise<BuyerAddressData> {
        Logger.info("Updating buyer address", { id, data });
        return this.buyerAddressRepository.updateBuyerAddress(id, data);
    }

    async deleteBuyerAddress(id: string): Promise<void> {
        Logger.info("Deleting buyer address", { id });
        return this.buyerAddressRepository.deleteBuyerAddress(id);
    }

    async searchAddresses(searchText: string, page: number, limit: number): Promise<AddressesData[]> {
        Logger.info("Searching buyer addresses", { searchText, page, limit });
        return this.buyerAddressRepository.findBuyerAddressBySearchText(searchText, page, limit);
    }
}
