import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { getSMSOTPDataResult, IOTPRepository, IOTPService, verifySMSOTPSMSDataResult } from "@business/interfaces/otp.interfaces";

@injectable()
export class OTPService implements IOTPService {
    constructor(
        @inject(TYPES.OTPRepository) private OTPRepository: IOTPRepository
    ) { }

    requestOTPSMS(msisdn: string): Promise<getSMSOTPDataResult> {
        return this.OTPRepository.requestOTPSMS(msisdn);
    }
    verifyOTPSMS(token: string, pin: string): Promise<verifySMSOTPSMSDataResult> {
        return this.OTPRepository.verifyOTPSMS(token, pin);
    }

    requestOTPEmail(userId: string, email: string): Promise<getSMSOTPDataResult> {
        return this.OTPRepository.requestOTPEmail(userId, email);
    }

    verifyOTPEmail(token: string, pin: string): Promise<verifySMSOTPSMSDataResult> {
        return this.OTPRepository.verifyOTPEmail(token, pin);
    }

}
