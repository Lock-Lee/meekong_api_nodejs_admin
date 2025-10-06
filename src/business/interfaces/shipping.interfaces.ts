



export interface CourierInformationResult {
    courier_name: string;
    courier_code: string;
    courier_service: string;
    image: string;
    information: {
        language: string;
        marketplace_name: string;
        status: string;
        service_type: string;
        service_extra: string;
        service_period: string;
        cut_of_time: string;
        cutoff_times: Array<{
            label: string;
            time: string;
            _id: string;
        }>;
        delivery_period: string;
        pick_up_time: string;
        pickup_time: {
            offset: number;
            unit: string;
            _id: string;
        };
        price_initial: string;
        area_cover: string;
        cod_percent: string;
        cod_period: string;
        max_weight: string;
        physical_limit: string;
        minimum_parcel: string;
        insurance_cover: string;
        insurance_extra: string;
        notices_html: string;
        services_html: string;
        term_of_usages_html: string;
        special_conditions_html: string;
        quotation_pre_conditions_html: string;
        quotation_cod_conditions_html: string;
        notices_list: string[];
        services_list: string[];
        term_of_usages_list: string[];
        special_conditions_list: string[];
        quotation_pre_conditions_list: string[];
        quotation_cod_conditions_list: string[];
        _id: string;
    };
}

export interface ShippingAddress {
    name: string;
    address: string;
    district: string;
    state: string;
    province: string;
    postcode: string;
    tel: string;
    lat?: string;
    lng?: string;
}

export interface ShippingParcel {
    name: string;
    weight: number;
    width: number;
    length: number;
    height: number;
}

export interface ShippingItem {
    from: ShippingAddress;
    to: ShippingAddress;
    parcel: ShippingParcel;
    courier_code: string;
    showall: number;
}

export interface InputShippingDetails {
    from: ShippingAddress;
    to: ShippingAddress;
    parcel: ShippingParcel;
    courier_code: string;
    showall: number;
}

export interface ShippingPriceRequest {
    api_key: string;
    data: { [key: string]: ShippingItem };
}

export interface IshippingRepository {
    courierInformation(language: string): Promise<CourierInformationResult>;
    checkPrice(data: InputShippingDetails): Promise<unknown>;
    checkPriceMultiple(data: ShippingItem[]): Promise<unknown>;
}

export interface IshippingService {
    courierInformation(language: string): Promise<CourierInformationResult>;
    checkPrice(data: InputShippingDetails): Promise<unknown>;
    checkPriceMultiple(data: ShippingItem[]): Promise<unknown>;
}
