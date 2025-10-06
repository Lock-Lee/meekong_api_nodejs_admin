import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { PrismaClient } from "@prisma/client";
import { CourierInformationResult, InputShippingDetails, IshippingRepository, ShippingItem, ShippingPriceRequest } from "@business/interfaces/shipping.interfaces";

import authConfig from "@config/auth.config";
import { Logger } from "../../shared/utils/logger";


@injectable()
export class ShippingRepository implements IshippingRepository {
    private prisma: PrismaClient;

    constructor(
        @inject(TYPES.PrismaClient) prisma: PrismaClient
    ) {
        this.prisma = prisma;
    }
    async courierInformation(language: string): Promise<CourierInformationResult> {
        try {
            const url = `${authConfig.shippop_api_url}/v1/couriers/api/courier/information/${language}`;
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer bWVla29uZ2FwcEBnbWFpbC5jb206bWVla29uZzcyMDI1`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch courier information: ${response.statusText}`);
            }

            const result = await response.json() as CourierInformationResult;
            return result;
        } catch (error) {
            Logger.info('Error while fetching courier information:', { error });
            throw error;
        }
    }
    async checkPrice(data: InputShippingDetails): Promise<unknown> {
        try {
            // Convert single item to array format for the new endpoint
            return await this.checkPriceMultiple([data]);
        } catch (error) {
            Logger.info('Error while checking shipping price:', { error });
            throw error;
        }
    }

    async checkPriceMultiple(data: ShippingItem[]): Promise<unknown> {
        try {
            const url = `https://mkpservice.shippop.dev/pricelist/`;

            // Convert array to object with numeric keys
            const dataObject: { [key: string]: ShippingItem } = {};
            data.forEach((item, index) => {
                dataObject[index.toString()] = item;
            });

            const requestBody: ShippingPriceRequest = {
                api_key: authConfig.shippop_api_key,
                data: dataObject
            };

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic bWVla29uZ2FwcEBnbWFpbC5jb206bWVla29uZzcyMDI1'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Failed to check price: ${response.statusText}`);
            }

            const result = await response.json();
            return result;

        } catch (error) {
            Logger.info('Error while checking multiple shipping prices:', { error });
            throw error;
        }
    }
}
