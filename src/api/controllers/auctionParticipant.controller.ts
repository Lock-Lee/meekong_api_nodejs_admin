import { Request, Response } from "express";
import Send from "@utils/response.utils";
import { inject, injectable } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { IAuctionParticipantService } from "../../business/interfaces/auction-participant.interfaces";
import participantSchema from "@schemas/auction-participant.schemas";
import { BusinessError } from "../../shared/errors/business.errors";
import { Logger } from "../../shared/utils/logger";

@injectable()
export class AuctionParticipantController {
  constructor(
    @inject(TYPES.AuctionParticipantService) private readonly participantService: IAuctionParticipantService
  ) { }

  async getByAuction(req: Request, res: Response): Promise<void> {
    try {
      const { auctionId } = req.params;

      Logger.info("Listing auction participants", { auctionId, requestId: req.id });

      const participants = await this.participantService.getParticipantsByAuction(auctionId);

      Logger.info("Auction participants retrieved", {
        auctionId,
        participantCount: participants.length,
        requestId: req.id
      });

      return Send.success(res, participants);
    } catch (error) {
      Logger.error("Failed to list auction participants", {
        error: (error as Error).message,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Failed to retrieve auction participants.");
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const bodyValidation = participantSchema.createParticipant.safeParse(req.body);
      if (!bodyValidation.success) {
        Logger.warn("Invalid request body for participant creation", {
          errors: bodyValidation.error.errors,
          requestId: req.id
        });
        return Send.error(res, bodyValidation.error.errors, "Invalid request body.");
      }

      const participantData = bodyValidation.data;

      Logger.info("Creating auction participant", {
        auctionId: participantData.auctionId,
        userId: participantData.userId,
        requestId: req.id
      });

      const participant = await this.participantService.createParticipant(participantData);

      Logger.info("Auction participant created", {
        participantId: participant.id,
        auctionId: participantData.auctionId,
        requestId: req.id
      });

      return Send.success(res, participant, "Auction participant created successfully.");
    } catch (error) {
      Logger.error("Failed to create auction participant", {
        error: (error as Error).message,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Failed to create auction participant.");
    }
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const paramsValidation = participantSchema.updateParticipantParams.safeParse(req.params);
      if (!paramsValidation.success) {
        Logger.warn("Invalid parameters for participant update", {
          errors: paramsValidation.error.issues,
          requestId: req.id
        });
        return Send.error(res, paramsValidation.error.issues, "Invalid parameters.");
      }

      const bodyValidation = participantSchema.updateParticipant.safeParse(req.body);
      if (!bodyValidation.success) {
        Logger.warn("Invalid request body for participant update", {
          errors: bodyValidation.error.errors,
          requestId: req.id
        });
        return Send.error(res, bodyValidation.error.errors, "Invalid request body.");
      }

      const { id } = paramsValidation.data;
      const updateData = bodyValidation.data;

      Logger.info("Updating auction participant", {
        participantId: id,
        status: updateData.status,
        requestId: req.id
      });

      const updatedParticipant = await this.participantService.updateParticipant(id, updateData);

      Logger.info("Auction participant updated", {
        participantId: id,
        newStatus: updateData.status,
        requestId: req.id
      });

      return Send.success(res, updatedParticipant, "Auction participant updated successfully.");
    } catch (error) {
      Logger.error("Failed to update auction participant", {
        error: (error as Error).message,
        participantId: req.params?.id,
        requestId: req.id
      });

      if (error instanceof BusinessError) {
        return Send.error(res, null, error.message, error.statusCode);
      }

      return Send.error(res, null, "Failed to update auction participant.");
    }
  }
}

export default AuctionParticipantController;