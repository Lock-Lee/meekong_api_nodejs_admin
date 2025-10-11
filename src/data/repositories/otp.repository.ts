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

    async requestOTPEmail(userId: string, email: string): Promise<getSMSOTPDataResult> {
        try {
            // Generate a 6-digit OTP
            const pin = Math.floor(100000 + Math.random() * 900000).toString();
            const token = `email_${Date.now()}_${userId}`;
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

            // Store OTP in database
            await this.prisma.oTPEmail.create({
                data: {
                    token,
                    pin,
                    email,
                    userId,
                    expiresAt,
                    verified: false,
                },
            });

            // TODO: Send email with OTP
            // You should integrate with an email service here (SendGrid, AWS SES, etc.)
            console.log(`OTP Email sent to ${email}: ${pin}`);

            return {
                status: 'success',
                token,
                refno: pin.substring(0, 4),
            };
        } catch (error) {
            console.error('Error while requesting OTP Email:', error);
            throw error;
        }
    }

    async verifyOTPEmail(token: string, pin: string): Promise<verifySMSOTPSMSDataResult> {
        try {
            const otpRecord = await this.prisma.oTPEmail.findFirst({
                where: {
                    token,
                    pin,
                    verified: false,
                    expiresAt: {
                        gte: new Date(),
                    },
                },
            });

            if (!otpRecord) {
                return {
                    status: 'error',
                    message: 'Invalid or expired OTP',
                };
            }

            // Mark as verified
            await this.prisma.oTPEmail.update({
                where: {
                    id: otpRecord.id,
                },
                data: {
                    verified: true,
                },
            });

            return {
                status: 'success',
                message: 'OTP verified successfully',
                userId: otpRecord.userId, // Return userId for password reset
            };
        } catch (error) {
            console.error('Error while verifying OTP Email:', error);
            throw error;
        }
    }

}
