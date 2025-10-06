import { ISizeUnitService, SizeUnitData, ISizeUnitRepository } from "../../business/interfaces/size-unit.interfaces";
import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { Logger } from "../../shared/utils/logger";

@injectable()
export class SizeUnitService implements ISizeUnitService {
    constructor(
        @inject(TYPES.SizeUnitRepository) private sizeUnitRepository: ISizeUnitRepository
    ) { }

    async getSizeUnitByCategory(categoryId: string): Promise<SizeUnitData[]> {
        Logger.info("Getting size unit by categoryId", { categoryId });
        return this.sizeUnitRepository.findSizeUnitByCategory(categoryId);
    }
}