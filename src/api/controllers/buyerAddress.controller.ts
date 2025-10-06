import { Request, Response } from "express";
import { injectable } from "inversify";
import Send from "@utils/response.utils";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import { BusinessError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";
import { IBuyerAddressService } from "../../business/interfaces/buyer-address.interfaces";


@injectable()
export class BuyerAddressController {
  private buyerAddressService: IBuyerAddressService;

  constructor() {
    this.buyerAddressService = container.get<IBuyerAddressService>(TYPES.BuyerAddressService);
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Fetching all buyer addresses", { requestId: req.id });
      const buyerAddresses = await this.buyerAddressService.getAllBuyerAddress(req.query.userId as string);

      Logger.info("Buyer addresses retrieved successfully", {
        buyerAddressCount: buyerAddresses.length,
        requestId: req.id
      });

      return Send.success(res, buyerAddresses, "Buyer addresses fetched successfully.");
    } catch (error) {
      Logger.error("Failed to fetch buyer addresses", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Fetching buyer address by ID", { requestId: req.id });
      const buyerAddress = await this.buyerAddressService.getBuyerAddressById(req.params.id);

      if (!buyerAddress) {
        throw new BusinessError("Buyer address not found");
      }

      Logger.info("Buyer address retrieved successfully", {
        buyerAddressId: buyerAddress.id,
        requestId: req.id
      });

      return Send.success(res, buyerAddress, "Fetched  Buyer address by ID successfully.");
    } catch (error) {
      Logger.error("Failed to fetch buyer address by ID", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Creating buyer address", { requestId: req.id });

      const buyerAddress = await this.buyerAddressService.createBuyerAddress(req.body);

      Logger.info("Buyer address created successfully", {
        buyerAddressId: buyerAddress.id,
        requestId: req.id
      });

      return Send.success(res, buyerAddress, "Buyer address created successfully.");
    } catch (error) {
      Logger.error("Failed to create buyer address", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      Logger.info("Updating buyer address", { requestId: req.id });

      const buyerAddress = await this.buyerAddressService.updateBuyerAddress(req.params.id, req.body);

      Logger.info("Buyer address updated successfully", {
        buyerAddressId: buyerAddress.id,
        requestId: req.id
      });

      return Send.success(res, buyerAddress, "Buyer address updated successfully.");
    } catch (error) {
      Logger.error("Failed to update buyer address", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const addressId = req.params.id;
      Logger.info("Deleting buyer address", {
        buyerAddressId: addressId,
        requestId: req.id
      });

      await this.buyerAddressService.deleteBuyerAddress(addressId);

      Logger.info("Buyer address deleted successfully", {
        buyerAddressId: addressId,
        requestId: req.id
      });

      return Send.success(res, { id: addressId }, "Buyer address deleted successfully.");
    } catch (error) {
      Logger.error("Failed to delete buyer address", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }

  async getAddress(req: Request, res: Response): Promise<void> {
    try {
      const {
        searchText, page, limit
      } = req.query;
      const pageNumber = page ? parseInt(page as string) : 1;
      const limitNumber = limit ? parseInt(limit as string) : 15;

      const address = await this.buyerAddressService.searchAddresses(searchText as string, pageNumber, limitNumber);

      return Send.success(res, address, "Address fetched successfully.");
    } catch (error) {
      Logger.error("Failed to fetch address", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      throw error;
    }
  }


}