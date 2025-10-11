import { inject, injectable } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import {
  ISatisfyService,
  ISatisfyRepository,
  SatisfyData,
  CreateSatisfyRequest,
  SatisfyListAllResult,
  SatisfyDataById,
} from "../interfaces/satisfy.interfaces";
import { IItemRepository } from "../interfaces/item.interfaces";
import { SocketService } from "@shared/infra/socket/socket.service";
import { prisma, prisma as PrismaClient } from "@data/database/db";
import { BusinessError } from "../../shared/errors/business.errors";
import { OfferStatus, OrderStatus } from "../../../generated/prisma";
import { Logger } from "../../shared/utils/logger";

@injectable()
export class SatisfyService implements ISatisfyService {
  private readonly satisfyRepository: ISatisfyRepository;
  private readonly itemRepository: IItemRepository;
  private readonly socketService: SocketService;
  private readonly db: typeof PrismaClient;

  constructor(
    @inject(TYPES.SatisfyRepository) satisfyRepository: ISatisfyRepository,
    @inject(TYPES.ItemRepository) itemRepository: IItemRepository,
    @inject(TYPES.SocketService) socketService: SocketService,
    @inject(TYPES.PrismaClient) db: typeof PrismaClient,
  ) {
    this.satisfyRepository = satisfyRepository;
    this.itemRepository = itemRepository;
    this.socketService = socketService;
    this.db = db;
  }

  async getSatisfies(page: number = 1, itemId?: string, status?: OfferStatus, statusFilter?: string): Promise<SatisfyListAllResult> {
    const pageSize = 10; // Default page size

    if (page < 1) {
      throw new BusinessError("Page number must be greater than 0", 400);
    }

    const { satisfies, total, topPrice } = await this.satisfyRepository.findSatisfies(
      page,
      pageSize,
      itemId,
      status,
      statusFilter
    );

    const totalPages = Math.ceil(total / pageSize);

    return {
      items: satisfies,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
      topPrice,
    };
  }

  
  async getMonitorStatusSatisfies(page: number = 1, itemId?: string, status?: OfferStatus, statusFilter?: string): Promise<SatisfyListAllResult> {
    const pageSize = 10; // Default page size

    if (page < 1) {
      throw new BusinessError("Page number must be greater than 0", 400);
    }

    const { satisfies, total, topPrice, countPending, countWaitingToPay, countCompleted } = await this.satisfyRepository.findMonitorStatusSatisfy(
      page,
      pageSize,
      itemId,
      status,
      statusFilter
    );

    const totalPages = Math.ceil(total / pageSize);

    return {
      items: satisfies,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
      topPrice,
      countPending,
      countWaitingToPay,
      countCompleted,
    };
  }


  async getSatisfyById(
    itemId: string,
    buyerId?: string
  ): Promise<SatisfyDataById[]> {
    if (!itemId) {
      throw new BusinessError("Item ID is required", 400);
    }

    return await this.satisfyRepository.findSatisfyById(itemId, buyerId);
  }

  async createSatisfy(request: CreateSatisfyRequest): Promise<SatisfyData> {
    // Validate request
    if (!request.itemId) {
      throw new BusinessError("Item ID is required", 400);
    }

    if (!request.buyerId) {
      throw new BusinessError("Buyer ID is required", 400);
    }

    if (!request.agreedPrice || request.agreedPrice <= 0) {
      throw new BusinessError("Agreed price must be greater than 0", 400);
    }

    const item = await this.itemRepository.findById(request.itemId);
    if (!item) {
      throw new BusinessError("Item not found", 404);
    }

    // If there is already a paid/completed/shipped order for this item (and variant), consider it already has a winner
    const paidStatuses = [OrderStatus.PAID, OrderStatus.COMPLETED, OrderStatus.SHIPPED];
    const hasWinner = await prisma.orderItem.findFirst({
      where: {
        itemId: request.itemId,
        ...(request.variantId ? { variantId: request.variantId } : {}),
        order: { status: { in: paidStatuses } },
      },
      select: { id: true },
    });
    if (hasWinner) {
      throw new BusinessError("This item already has a winner", 400);
    }


    if(request.status === OfferStatus.OPEN) {
      const existSatisfy = await prisma.satisfy.findFirst({
        where: {
          itemId: request.itemId,
          variantId: request.variantId,
          sellerId: item.seller.id,
          buyerId: request.buyerId,
          status: {  notIn: [ OfferStatus.ADJUST] },
        },
        orderBy: {
          createdAt: 'desc', // เอาล่าสุดก่อน
        },
      });
      
      if(existSatisfy) {
        throw new BusinessError("Buyer already has an open satisfy for this item " + request.itemId + " and variant " + request.variantId, 400);
      }
     }
    
    // console.log(item);

    const satisfyData = {
      itemId: request.itemId,
      variantId: request.variantId,
      buyerId: request.buyerId,
      sellerId: item.seller.id,
      agreedPrice: request.agreedPrice,
      status: request.status || OfferStatus.NONE,
    };

    const created = await this.satisfyRepository.createSatisfy(satisfyData);

    try {
      const count = await this.db.satisfy.count({ where: { itemId: created.itemId } });
      this.socketService.emitSatisfyCountUpdate(created.itemId, count);
    } catch (e) {
      Logger.error("Failed to emit satisfy count update", e);
    }

    return created;
  }
}
