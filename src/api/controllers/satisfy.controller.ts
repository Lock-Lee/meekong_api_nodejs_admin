import { Request, Response } from "express";
import { injectable } from "inversify";
import Send from "@utils/response.utils";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import { ISatisfyService } from "../../business/interfaces/satisfy.interfaces";
import { z } from "zod";
import { OfferStatus } from "../../../generated/prisma";
import { Logger } from "../../shared/utils/logger";

const listSatisfyQuerySchema = z.object({
  page: z.string().optional().default("1").transform(Number),
  itemId: z.string().uuid().optional(),
  status: z.string().optional(),
  statusFilter: z.enum(["PENDING", "WAITING_TO_PAY", "END", "COMPLETED"]).optional(),
});

const createSatisfyBodySchema = z.object({
  itemId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  buyerId: z.string().uuid(),
  agreedPrice: z.number().positive(),
  status: z.nativeEnum(OfferStatus).optional(),
});

@injectable()
export class SatisfyController {
  private satisfyService: ISatisfyService;

  constructor() {
    this.satisfyService = container.get<ISatisfyService>(TYPES.SatisfyService);
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const validation = listSatisfyQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return Send.error(
          res,
          validation.error.issues,
          "Invalid query parameters."
        );
      }

      const { page, itemId, status , statusFilter } = validation.data;
      const result = await this.satisfyService.getSatisfies(page, itemId, status as OfferStatus, statusFilter);
      return Send.success(res, result);
    } catch (error) {
      Logger.error("Failed to list satisfies", {
        error: (error as Error).message,
      });
      return Send.error(res, null, "Failed to retrieve satisfy items.");
    }
  }


  async listMonitorStatus(req: Request, res: Response): Promise<void> {
    try {
      const validation = listSatisfyQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return Send.error(
          res,
          validation.error.issues,
          "Invalid query parameters."
        );
      }

      const { page, itemId, status , statusFilter } = validation.data;
      const result = await this.satisfyService.getMonitorStatusSatisfies(page, itemId, status as OfferStatus, statusFilter);
      return Send.success(res, result);
    } catch (error) {
      Logger.error("Failed to list satisfies", {
        error: (error as Error).message,
      });
      return Send.error(res, null, "Failed to retrieve satisfy items.");
    }
  }


  async create(req: Request, res: Response): Promise<void> {
    try {
      const validation = createSatisfyBodySchema.safeParse(req.body);
      if (!validation.success) {
        return Send.error(
          res,
          validation.error.errors,
          "Invalid request body."
        );
      }

      const satisfy = await this.satisfyService.createSatisfy(validation.data);
      return Send.success(res, satisfy, "Satisfy item created successfully.");
    } catch (error) {
      Logger.error("Failed to create satisfy", {
        error: (error as Error).message,
      });
      return Send.error(res, error, "An internal server error occurred.");
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { buyerId } = req.query;

      const result = await this.satisfyService.getSatisfyById(
        id,
        buyerId as string
      );

      if (!result) {
        return Send.error(res, null, "Satisfy item not found.");
      }

      return Send.success(res, result);
    } catch (error) {
      Logger.error("Failed to get satisfy", {
        error: (error as Error).message,
      });
      return Send.error(res, null, "Failed to retrieve satisfy item.");
    }
  }
}

export default SatisfyController;
