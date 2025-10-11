export interface BuyerPaymentData {
    id: string;          // token id หรือ customer id จาก Omise
    userId: string;      // ผู้ใช้ในระบบของคุณ
    cardId?: string;     // ถ้ามีการผูกบัตร
}

export interface CreateBuyerPaymentData {
    userId: string;
    email: string;
    card: {
        name: string;
        number: string;
        expiration_month: number;
        expiration_year: number;
        security_code: string;
        city: string;
        postal_code: string;
    };
}

export interface CreateChargeData {
    amount: number;       // จำนวนเงินที่เรียกเก็บ (สตางค์)
    currency: string;     // สกุลเงิน (เช่น "thb")
    card?: string;        // token id ของบัตร (optional สำหรับ source-based payments)
    returnUri: string;    // URI สำหรับ redirect หลังชำระเงิน
    description: string;  // คำอธิบายการชำระเงิน
    customer?: string;    // customer id (ถ้ามี)
}

export interface ChargeResponse {
    id: string;           // ID ของ charge ที่สร้างขึ้น
    status: string;       // สถานะของ charge (เช่น "successful", "pending")
    amount: number;       // จำนวนเงินที่เรียกเก็บ
    currency: string;     // สกุลเงิน
    description: string;  // คำอธิบายการชำระเงิน
    source?: {            // ข้อมูล source สำหรับ PromptPay และ Mobile Banking
        id?: string;
        type?: string;
        scannable_code?: string;  // QR Code สำหรับ PromptPay
        platform_type?: string;   // ธนาคารสำหรับ Mobile Banking
        expires_at?: string;
    };
}

export interface CreatePaymentByTypeData {
    paymentType: string;  // 'card', 'promptpay', 'mobile_banking'
    data: CreateChargeData;
    options?: {
        platformType?: string;  // สำหรับ mobile banking
    };
}

export interface PaymentMethod {
    object: string;
    name: string;
    currencies: string[];
    card_brands?: string[] | null;
    installment_terms?: number[] | null;
    loan_installment_terms?: number[] | null;
    banks: string[];
    provider?: string | null;
}

export interface CapabilityResponse {
    object: string;
    location: string;
    banks: string[];
    limits: {
        charge_amount: {
            max: number;
            min: number;
        };
        transfer_amount: {
            max: number;
            min: number;
        };
        installment_amount: {
            min: number;
        };
    };
    payment_methods: PaymentMethod[];
    country: string;
    tokenization_methods: string[];
    zero_interest_installments: boolean;
}
export interface ICardList {
    object: string;
    id: string;
    brand: string;
    last_digits: string;
    expiration_month: number;
    expiration_year: number;
    name?: string;               // ชื่อเจ้าของบัตร
    city?: string;               // เมือง
    postal_code?: string;        // รหัสไปรษณีย์
    country?: string;            // ประเทศ
    created_at?: string;         // วันที่สร้าง
    livemode?: boolean;          // สถานะการใช้งานจริง
    location?: string;           // ตำแหน่งของบัตรในระบบ
    deleted?: boolean;           // สถานะการลบบัตร
    financing?: string;          // ประเภทการเงิน (เช่น "credit")
    bank?: string;               // ชื่อธนาคาร
    fingerprint?: string;        // ลายนิ้วมือของบัตร
    security_code_check?: boolean; // สธานะการตรวจสอบรหัสความปลอดภัย
    tokenization_method?: string | null; // วิธีการสร้าง token
}

export interface ICard {
    id: string;
    financeProfileId: string;
    brand: string;
    lastDigits: string;
    expirationMonth: number;
    expirationYear: number;
    createdAt: Date;
    updatedAt: Date;
    financeProfile?: {
        id: string;
        userId: string;
    };
}

export interface CreateSourceItem {
    name: string;
    amount: number | string;
    quantity: number | string;
}

export interface CreateSourceData {
    type: string; // เช่น 'paypay', 'promptpay', 'mobile_banking_bbl', etc.
    amount: number;
    currency: string;
    items?: CreateSourceItem[];
    [key: string]: any; // สำหรับ field อื่นๆ ที่อาจต้องการ
}

export interface SourceResponse {
    id: string;
    object: string;
    type: string;
    flow: string;
    amount: number;
    currency: string;
    // ...สามารถเพิ่ม field อื่นๆ ตาม Omise API response...
}

export interface RefundResponse {
    id: string;           // ID ของ refund
    object: string;       // "refund"
    amount: number;       // จำนวนเงินที่คืน (สตางค์)
    currency: string;     // สกุลเงิน
    charge: string;       // charge ID ที่ทำการคืนเงิน
    transaction: string;  // transaction ID
    created: string;      // วันที่สร้าง
}

export interface IBuyerPaymentRepository {
    /**
     * สร้าง token จากข้อมูลบัตร  and ผูก token เข้ากับ customer (ใช้ Omise.customers.create)
     */
    createToken(data: CreateBuyerPaymentData): Promise<BuyerPaymentData>;
    getCustomerCardList(customerId: string): Promise<ICardList[]>;

    /**
     * ดึงข้อมูลการ์ดจากฐานข้อมูลตาม userId
     */
    getCardsByUserId(userId: string): Promise<ICard[]>;

    /**
     * ดึงข้อมูลการ์ดจากฐานข้อมูลตาม financeProfileId
     */
    getCardsByFinanceProfileId(financeProfileId: string): Promise<ICard[]>;

    /**
     * ดึงข้อมูลการ์ดเฉพาะใบตาม cardId
     */
    getCardById(cardId: string): Promise<ICard>;

    /**
     * ตรวจสอบว่า user มีการ์ดหรือไม่
     */
    hasCards(userId: string): Promise<boolean>;

    /**
     * สร้าง charge สำหรับการชำระเงิน
     */
    createCharge(data: CreateChargeData): Promise<ChargeResponse>;

    /**
     * อัปเดตข้อมูลบัตรของ customer
     */
    updateCustomerCard(customerId: string, cardToken: string): Promise<void>;

    /**
     * สร้าง PromptPay Payment
     */
    createPromptPayPayment(data: CreateChargeData): Promise<ChargeResponse>;

    /**
     * สร้าง Mobile Banking Payment
     */
    createMobileBankingPayment(data: CreateChargeData, platformType: string): Promise<ChargeResponse>;

    /**
     * สร้าง Payment แบบ Universal ตาม type
     */
    createPaymentByType(paymentType: string, data: CreateChargeData, options?: { platformType?: string }): Promise<ChargeResponse>;
    /* สร้าง source สำหรับช่องทางการชำระเงินต่างๆ (เช่น paypay, promptpay, mobile_banking_bbl)
    */
    createSource(data: CreateSourceData): Promise<SourceResponse>;

    /**
     * ดึงข้อมูล capability จาก Omise API
     */
    getCapability(): Promise<CapabilityResponse>;

    /**
     * คืนเงินจาก charge
     */
    refundCharge(chargeId: string, amount?: number): Promise<RefundResponse>;
}

export interface IBuyerPaymentService {
    createToken(data: CreateBuyerPaymentData): Promise<BuyerPaymentData>;
    createCharge(data: CreateChargeData): Promise<ChargeResponse>;
    getCustomerCardList(customerId: string): Promise<ICardList[]>;

    /**
     * ดึงข้อมูลการ์ดจากฐานข้อมูลตาม userId
     */
    getCardsByUserId(userId: string): Promise<ICard[]>;

    /**
     * ดึงข้อมูลการ์ดจากฐานข้อมูลตาม financeProfileId
     */
    getCardsByFinanceProfileId(financeProfileId: string): Promise<ICard[]>;

    /**
     * ดึงข้อมูลการ์ดเฉพาะใบตาม cardId
     */
    getCardById(cardId: string): Promise<ICard>;

    /**
     * ตรวจสอบว่า user มีการ์ดหรือไม่
     */
    hasCards(userId: string): Promise<boolean>;

    /**
     * อัปเดตข้อมูลบัตรของ customer
     */
    updateCustomerCard(customerId: string, cardToken: string): Promise<void>;

    /**
     * สร้าง PromptPay Payment
     */
    createPromptPayPayment(data: CreateChargeData): Promise<ChargeResponse>;

    /**
     * สร้าง Mobile Banking Payment
     */
    createMobileBankingPayment(data: CreateChargeData, platformType: string): Promise<ChargeResponse>;

    /**
     * สร้าง Payment แบบ Universal ตาม type
     */
    createPaymentByType(paymentType: string, data: CreateChargeData, options?: { platformType?: string }): Promise<ChargeResponse>;
    /* สร้าง source สำหรับช่องทางการชำระเงินต่างๆ (เช่น paypay, promptpay, mobile_banking_bbl)
    */
    createSource(data: CreateSourceData): Promise<SourceResponse>;

    /**
     * ดึงข้อมูล capability จาก Omise API
     */
    getCapability(): Promise<CapabilityResponse>;

    /**
     * คืนเงินจาก charge
     */
    refundCharge(chargeId: string, amount?: number): Promise<RefundResponse>;
}
