import { Request, Response } from "express";
import Send from "@utils/response.utils";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import { Logger } from "../../shared/utils/logger";
import { ISizeUnitService } from "../../business/interfaces/size-unit.interfaces";
import { BusinessError } from "../../shared/errors/business.errors";
import { injectable } from "inversify";

@injectable()
export class SizeUnitController {
    private sizeUnitService: ISizeUnitService;
    constructor() {
        this.sizeUnitService = container.get<ISizeUnitService>(TYPES.SizeUnitService);
    }


    async getSizeUnitByCategory(req: Request, res: Response) {
        try {
            Logger.info("Getting size unit by category", { requestId: req.id });
            const sizeUnit = await this.sizeUnitService.getSizeUnitByCategory(req.query.categoryId as string);
            return Send.success(res, sizeUnit, "Size unit by category retrieved successfully.");
        } catch (error) {
            Logger.error("Failed to get size unit by category", { requestId: req.id });
            if (error instanceof BusinessError) {
                return Send.error(res, null, error.message, error.statusCode);
            }
            return Send.error(res, error);
        }
    }

}
export default SizeUnitController;