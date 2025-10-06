import { Request, Response } from "express";
import Send from "@utils/response.utils";
import { inject, injectable } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { ICartService } from "../../business/interfaces/cart.interfaces";
import { SellType } from "../../../generated/prisma";
import { z } from "zod";
import { Logger } from "../../shared/utils/logger";

const getCartItemsQuerySchema = z.object({
  sellType: z
    .union([z.nativeEnum(SellType), z.array(z.nativeEnum(SellType))])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (Array.isArray(val)) return val;
      return [val];
    }),
  page: z.string().optional().default("1").transform(Number),
});

const manageCartItemBodySchema = z.object({
  itemId: z.string().uuid(),
  variantId: z.string().uuid(),
  quantity: z
    .number()
    .int()
    .refine((val) => val !== 0, { message: "Quantity cannot be zero." }),
});

@injectable()
export class CartController {
  constructor(
    @inject(TYPES.CartService) private readonly cartService: ICartService
  ) {}

  async getSatisfy(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, pageSize = 10 } = req.query;
      const result = await this.cartService.getSatisfyItems(
        Number(page),
        Number(pageSize)
      );
      return Send.success(res, result);
    } catch (error) {
      Logger.error("Failed to get satisfies", {
        error: (error as Error).message,
      });
      return Send.error(res, error, "Failed to get satisfies.");
    }
  }

  async getAuction(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, pageSize = 10 } = req.query;
      const userId = req.userId;
      if (!userId) {
        return Send.error(res, null, "User not authenticated.", 401);
      }
      const result = await this.cartService.getAuctionItems(
        Number(page),
        Number(pageSize),
        userId
      );
      return Send.success(res, result);
    } catch (error) {
      Logger.error("Failed to get auctions", {
        error: (error as Error).message,
      });
      return Send.error(res, error, "Failed to get auctions.");
    }
  }

  async get(req: Request, res: Response): Promise<void> {
    try {
      const validation = getCartItemsQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return Send.error(
          res,
          validation.error.issues,
          "Invalid query parameters."
        );
      }

      const userId = req.userId;
      if (!userId) {
        return Send.error(res, null, "User not authenticated.", 401);
      }

      const { sellType, page } = validation.data;
      const result = await this.cartService.getCartItems(userId, {
        sellType,
        page,
      });
      return Send.success(res, result);
    } catch (error) {
      Logger.error("Failed to get cart items", {
        error: (error as Error).message,
      });
      return Send.error(res, error, "An internal server error occurred.");
    }
  }

  async manageCartItem(req: Request, res: Response): Promise<void> {
    try {
      const validation = manageCartItemBodySchema.safeParse(req.body);
      if (!validation.success) {
        return Send.error(
          res,
          validation.error.errors,
          "Invalid request body."
        );
      }

      const userId = req.userId;
      if (!userId) {
        return Send.error(res, null, "User not authenticated.", 401);
      }

      const message = await this.cartService.manageCartItem(
        userId,
        validation.data
      );
      return Send.success(res, null, message);
    } catch (error) {
      Logger.error("Failed to manage cart item", {
        error: (error as Error).message,
      });
      return Send.error(res, error, "An internal server error occurred.");
    }
  }
}

export default CartController;
