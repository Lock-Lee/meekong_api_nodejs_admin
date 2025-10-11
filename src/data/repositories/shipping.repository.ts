import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { PrismaClient } from "@prisma/client";
import { CourierInformationResult, InputShippingDetails, IshippingRepository, ShippingItem } from "@business/interfaces/shipping.interfaces";

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

            // Transform and convert array to object with numeric keys
            const dataObject: Record<string, unknown> = {};
            data.forEach((item, index) => {
                dataObject[index.toString()] = {
                    from: {
                        name: item.from.name || '',
                        address: item.from.address || '',
                        district: item.from.district || item.from.district_name || '',
                        state: item.from.state || item.from.district || item.from.district_name || '',
                        province: item.from.province || item.from.state_name || item.from.state || '',
                        postcode: item.from.postcode,
                        tel: item.from.tel || '',
                        ...(item.from.lat && { lat: item.from.lat }),
                        ...(item.from.lng && { lng: item.from.lng })
                    },
                    to: {
                        name: item.to.name || '',
                        address: item.to.address || '',
                        district: item.to.district || item.to.district_name || '',
                        state: item.to.state || item.to.district || item.to.district_name || '',
                        province: item.to.province || item.to.state_name || item.to.state || '',
                        postcode: item.to.postcode,
                        tel: item.to.tel || '',
                        ...(item.to.lat && { lat: item.to.lat }),
                        ...(item.to.lng && { lng: item.to.lng })
                    },
                    parcel: item.parcel,
                    courier_code: item.courier_code,
                    showall: item.showall || 1
                };
            });

            const requestBody = {
                api_key: authConfig.shippop_api_key || "dvd7c010e7fc3fd3fae000b4991630cc91a066ea583ecae869db3a635272b6292f167d51d053fff02d1753238615",
                data: dataObject
            };

            Logger.info('Sending request to Shippop API:', {
                url,
                requestBody: JSON.stringify(requestBody, null, 2)
            });

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic bWVla29uZ2FwcEBnbWFpbC5jb206bWVla29uZzcyMDI1',
                    'Cookie': 'spo=kdibbr58f7jeqeuqrgj7ecf2qk; spo_cookie=%7B%22lang%22%3A%22th%22%7D; spo_cookie=%7B%22lang%22%3A%22th%22%7D'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                Logger.error('Shippop API error response:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorText
                });
                throw new Error(`Failed to check price: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            Logger.info('Shippop API success response:', { result });
            return result;

        } catch (error) {
            Logger.error('Error while checking multiple shipping prices:', { error });
            throw error;
        }
    }
}
