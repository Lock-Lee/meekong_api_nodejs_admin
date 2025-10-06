import { injectable } from "inversify";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import { Logger } from "../../shared/utils/logger";
import { InputShippingDetails, IshippingService, ShippingItem } from "@business/interfaces/shipping.interfaces";
import { Request, Response } from "express";

@injectable()
export class ShippingController {
  private shippingService: IshippingService;
  constructor() {
    this.shippingService = container.get<IshippingService>(TYPES.ShippingService);
  }
  async getCourierInformation(req: Request, res: Response) {
    try {
      Logger.info("Fetching courier information", { requestId: req.id });
      const { language } = req.params;

      if (!language) {
        Logger.warn("Missing language in request params", { requestId: req.id });
        return res.status(400).json({ message: "language is required" });
      }


      const courierResponse = await this.shippingService.courierInformation(language);

      Logger.info("Courier information retrieved successfully", {
        requestId: req.id,
        courierResponse
      });

      return res.status(200).json(courierResponse);
    } catch (error) {

      Logger.error("Error fetching courier information", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return res.status(500).json({ message: "Failed to retrieve courier information" });
    }
  }
  async checkPrice(req: Request, res: Response): Promise<Response | void> {
    try {
      Logger.info("Checking shipping price", { requestId: req.id, body: req.body });

      const data: InputShippingDetails = req.body;

      // Basic validation
      if (!data.from || !data.to || !data.parcel || !data.courier_code) {
        Logger.warn("Missing required fields in request body", { requestId: req.id });
        return res.status(400).json({ message: "from, to, parcel, and courier_code are required" });
      }

      const priceResponse = await this.shippingService.checkPrice(data);

      Logger.info("Shipping price checked successfully", {
        requestId: req.id
      });

      return res.status(200).json(priceResponse);
    } catch (error) {
      Logger.error("Error checking shipping price", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return res.status(500).json({ message: "Failed to check shipping price" });
    }
  }

  async checkPriceMultiple(req: Request, res: Response): Promise<Response | void> {
    try {
      Logger.info("Checking multiple shipping prices", { requestId: req.id, body: req.body });

      const data: ShippingItem[] = req.body;

      // Basic validation
      if (!Array.isArray(data) || data.length === 0) {
        Logger.warn("Invalid request body - expected array of shipping items", { requestId: req.id });
        return res.status(400).json({ message: "Expected array of shipping items" });
      }

      // Validate each item
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (!item.from || !item.to || !item.parcel || !item.courier_code) {
          Logger.warn(`Missing required fields in item ${i}`, { requestId: req.id });
          return res.status(400).json({
            message: `Item ${i}: from, to, parcel, and courier_code are required`
          });
        }
      }

      const priceResponse = await this.shippingService.checkPriceMultiple(data);

      Logger.info("Multiple shipping prices checked successfully", {
        requestId: req.id,
        itemCount: data.length
      });

      return res.status(200).json(priceResponse);
    } catch (error) {
      Logger.error("Error checking multiple shipping prices", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return res.status(500).json({ message: "Failed to check multiple shipping prices" });
    }
  }
}