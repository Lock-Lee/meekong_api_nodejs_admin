import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { CourierInformationResult, InputShippingDetails, IshippingRepository, IshippingService, ShippingItem } from "@business/interfaces/shipping.interfaces";

@injectable()
export class ShippingService implements IshippingService {
    constructor(
        @inject(TYPES.ShippingRepository) private shippingRepository: IshippingRepository
    ) { }

    courierInformation(language: string): Promise<CourierInformationResult> {
        return this.shippingRepository.courierInformation(language);
    }

    checkPrice(data: InputShippingDetails): Promise<unknown> {
        return this.shippingRepository.checkPrice(data);
    }

    checkPriceMultiple(data: ShippingItem[]): Promise<unknown> {
        return this.shippingRepository.checkPriceMultiple(data);
    }
}
