

export interface getSMSOTPDataResult {
    status: string,
    token: string,
    refno: string
}

export interface verifySMSOTPSMSDataResult {
    status: string,
    message: string,
}



export interface IOTPRepository {
    requestOTPSMS(msisdn: string): Promise<getSMSOTPDataResult>;
    verifyOTPSMS(token: string, pin: string): Promise<verifySMSOTPSMSDataResult>;
    // requestOTPEmail(email: string): Promise<getSMSOTPDataResult>;
    // verifyOTPEmail(token: string, code: string): Promise<verifySMSOTPSMSDataResult>;
}

export interface IOTPService {
    requestOTPSMS(msisdn: string): Promise<getSMSOTPDataResult>;
    verifyOTPSMS(token: string, pin: string): Promise<verifySMSOTPSMSDataResult>;
    // requestOTPEmail(email: string): Promise<getSMSOTPDataResult>;
    // verifyOTPEmail(token: string, code: string): Promise<verifySMSOTPSMSDataResult>;
}
