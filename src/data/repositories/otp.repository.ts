import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { PrismaClient } from "@prisma/client";
import { getSMSOTPDataResult, IOTPRepository, verifySMSOTPSMSDataResult } from "@business/interfaces/otp.interfaces";

import authConfig from "@config/auth.config";


@injectable()
export class OTPRepository implements IOTPRepository {
    private prisma: PrismaClient;

    constructor(
        @inject(TYPES.PrismaClient) prisma: PrismaClient
    ) {
        this.prisma = prisma;
    }
    async requestOTPSMS(msisdn: string): Promise<getSMSOTPDataResult> {
        try {
            const encodedParams = new URLSearchParams();

            encodedParams.set('msisdn', msisdn);
            encodedParams.set('key', authConfig.thai_bulk_api_key);
            encodedParams.set('secret', authConfig.thai_bulk_api_secret);
            const response = await fetch(`${authConfig.thai_bulk_url}/otp/request`, {
                method: "POST",
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/x-www-form-urlencoded'
                },
                body: encodedParams.toString(),
            });

            if (!response.ok) {
                throw new Error(`Failed to request OTP SMS: ${response.statusText}`);
            }

            const result: getSMSOTPDataResult = await response.json() as getSMSOTPDataResult;
            return result;
        } catch (error) {
            console.error('Error while requesting OTP SMS:', error);
            throw error;
        }
    }
    async verifyOTPSMS(token: string, pin: string): Promise<verifySMSOTPSMSDataResult> {
        const encodedParams = new URLSearchParams();
        encodedParams.set('key', authConfig.thai_bulk_api_key);
        encodedParams.set('secret', authConfig.thai_bulk_api_secret);
        encodedParams.set('token', token);
        encodedParams.set('pin', pin);

        const response = await fetch(`${authConfig.thai_bulk_url}/otp/verify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: encodedParams.toString(),
        });
        if (!response.ok) {
            throw new Error(`Failed to verify OTP SMS: ${response.statusText}`);
        }

        const result: verifySMSOTPSMSDataResult = await response.json() as verifySMSOTPSMSDataResult;
        return result;
    }


}
