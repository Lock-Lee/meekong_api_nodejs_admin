

export interface getSMSOTPDataResult {
    status: string,
    token: string,
    refno: string
}

export interface verifySMSOTPSMSDataResult {
    status: string,
    message: string,
    userId?: string, // For email OTP verification
}



export interface IOTPRepository {
    requestOTPSMS(msisdn: string): Promise<getSMSOTPDataResult>;
    verifyOTPSMS(token: string, pin: string): Promise<verifySMSOTPSMSDataResult>;
    requestOTPEmail(userId: string, email: string): Promise<getSMSOTPDataResult>;
    verifyOTPEmail(token: string, pin: string): Promise<verifySMSOTPSMSDataResult>;
}

export interface IOTPService {
    requestOTPSMS(msisdn: string): Promise<getSMSOTPDataResult>;
    verifyOTPSMS(token: string, pin: string): Promise<verifySMSOTPSMSDataResult>;
    requestOTPEmail(userId: string, email: string): Promise<getSMSOTPDataResult>;
    verifyOTPEmail(token: string, pin: string): Promise<verifySMSOTPSMSDataResult>;
}
