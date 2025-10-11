import { injectable, inject } from "inversify";
import { TYPES } from "../../shared/types/service.types";
import { PrismaClient, CardBrand } from "../../../generated/prisma";

import {
  BuyerPaymentData,
  ChargeResponse,
  CreateBuyerPaymentData,
  CreateChargeData,
  CreateSourceData,
  IBuyerPaymentRepository,
  ICardList,
  ICard,
  SourceResponse,
  CapabilityResponse,
} from "@business/interfaces/buyer-payment.interfaces";
import { OmiseClient } from "@shared/infra/omise/omise.client";

// Define or import the ICardList interface


@injectable()
export class BuyerPaymentRepository implements IBuyerPaymentRepository {
  constructor(
    @inject(TYPES.PrismaClient) private prisma: PrismaClient,
    @inject(TYPES.OmiseClient) private omise: OmiseClient
  ) { }
  createSource(data: CreateSourceData): Promise<SourceResponse> {
    return this.omise.sources.create({
      type: data.type,
      amount: data.amount,
      currency: data.currency,
      email: data.email,
    }) as unknown as Promise<SourceResponse>;
  }
  async getCustomerCardList(customerId: string): Promise<ICardList[]> {
    try {
      if (!customerId) {
        throw new Error('customerId is required');
      }

      const res = await this.omise.customers.listCards(customerId);
      return res.data as unknown as ICardList[];
    } catch (error) {
      throw new Error(`Failed to get customer card list: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ดึงข้อมูลการ์ดจากฐานข้อมูลตาม userId
   */
  async getCardsByUserId(userId: string): Promise<ICard[]> {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      const cards = await this.prisma.card.findMany({
        where: {
          financeProfile: {
            userId: userId
          }
        },
        include: {
          financeProfile: {
            select: {
              id: true,
              userId: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return cards;
    } catch (error) {
      throw new Error(`Failed to get cards by user ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ดึงข้อมูลการ์ดจากฐานข้อมูลตาม financeProfileId
   */
  async getCardsByFinanceProfileId(financeProfileId: string): Promise<ICard[]> {
    try {
      if (!financeProfileId) {
        throw new Error('financeProfileId is required');
      }

      const cards = await this.prisma.card.findMany({
        where: {
          financeProfileId: financeProfileId
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return cards;
    } catch (error) {
      throw new Error(`Failed to get cards by finance profile ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ดึงข้อมูลการ์ดเฉพาะใบตาม cardId
   */
  async getCardById(cardId: string): Promise<ICard> {
    try {
      if (!cardId) {
        throw new Error('cardId is required');
      }

      const card = await this.prisma.card.findUnique({
        where: {
          id: cardId
        },
        include: {
          financeProfile: {
            select: {
              id: true,
              userId: true
            }
          }
        }
      });

      if (!card) {
        throw new Error(`Card with ID ${cardId} not found`);
      }

      return card;
    } catch (error) {
      throw new Error(`Failed to get card by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ตรวจสอบว่า user มีการ์ดหรือไม่
   */
  async hasCards(userId: string): Promise<boolean> {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      const cardCount = await this.prisma.card.count({
        where: {
          financeProfile: {
            userId: userId
          }
        }
      });

      return cardCount > 0;
    } catch (error) {
      throw new Error(`Failed to check if user has cards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateCustomerCard(customerId: string, cardToken: string): Promise<void> {
    try {
      if (!customerId || !cardToken) {
        throw new Error('customerId and cardToken are required');
      }

      await this.omise.customers.update(customerId, {
        card: cardToken,
      });
    } catch (error) {
      throw new Error(`Failed to update customer card: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * สร้าง Source สำหรับการชำระเงินตาม type ที่ระบุ
   * @param type ประเภทการชำระเงิน (promptpay, mobile_banking_scb, etc.)
   * @param amount จำนวนเงิน (หน่วย: สตางค์)
   * @param currency สกุลเงิน
   * @param platformType สำหรับ mobile banking (scb, bay, ktb, bbl, kbank, ttb, gsb, uob) - will be appended to mobile_banking_
   * @param description คำอธิบาย
   */
  async createPaymentSource(
    type: string,
    amount: number,
    currency: string = 'THB',
    platformType?: string,
    description?: string
  ) {
    try {
      // For mobile banking, construct the correct type
      let sourceType = type;
      if (type === 'mobile_banking' && platformType) {
        sourceType = `mobile_banking_${platformType}`;
      }

      const sourceData = {
        type: sourceType,
        amount: amount,
        currency: currency,
        description: description
      };

      const source = await this.omise.sources.create(sourceData);

      return {
        id: source.id,
        type: source.type,
        amount: source.amount,
        currency: source.currency,
        flow: source.flow,
        scannable_code: (source as unknown as { scannable_code?: string }).scannable_code, // QR Code สำหรับ PromptPay
        platform_type: (source as unknown as { platform_type?: string }).platform_type, // สำหรับ Mobile Banking
        expires_at: (source as unknown as { expires_at?: string }).expires_at,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create payment source: ${error.message}`);
      } else {
        throw new Error(`Failed to create payment source: ${JSON.stringify(error)}`);
      }
    }
  }

  /**
   * สร้าง PromptPay Payment
   */
  async createPromptPayPayment(data: CreateChargeData): Promise<ChargeResponse> {
    try {
      const source = await this.createPaymentSource(
        'promptpay',
        data.amount,
        data.currency,
        undefined,
        data.description
      );

      return this.createChargeWithSource(source.id, data);
    } catch (error) {
      throw new Error(`Failed to create PromptPay payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * สร้าง Mobile Banking Payment
   * @param platformType ธนาคาร (scb, bay, ktb, bbl, kbank, ttb, gsb, uob)
   */
  async createMobileBankingPayment(
    data: CreateChargeData,
    platformType: string
  ): Promise<ChargeResponse> {
    try {
      if (!platformType) {
        throw new Error('platformType is required for mobile banking payment');
      }

      const source = await this.createPaymentSource(
        'mobile_banking',
        data.amount,
        data.currency,
        platformType,
        data.description
      );

      return this.createChargeWithSource(source.id, data);
    } catch (error) {
      throw new Error(`Failed to create Mobile Banking payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * สร้าง Charge จาก Source
   */
  async createChargeWithSource(sourceId: string, data: CreateChargeData): Promise<ChargeResponse> {
    try {
      if (!sourceId) {
        throw new Error('sourceId is required for creating charge');
      }

      const charge = await this.omise.charges.create({
        amount: data.amount,
        currency: data.currency,
        source: sourceId,
        return_uri: data.returnUri,
        description: data.description,
      });

      // TODO: บันทึกข้อมูล charge ลงในฐานข้อมูลถ้าจำเป็น

      return {
        id: charge.id,
        amount: charge.amount,
        currency: charge.currency,
        status: charge.status,
        description: charge.description,
        source: {
          id: charge.source?.id,
          type: charge.source?.type,
          scannable_code: (charge.source as unknown as { scannable_code?: string })?.scannable_code,
          platform_type: (charge.source as unknown as { platform_type?: string })?.platform_type,
          expires_at: (charge.source as unknown as { expires_at?: string })?.expires_at,
        }
      } as ChargeResponse;
    } catch (error) {
      throw new Error(`Failed to create charge with source: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * สร้าง Payment แบบ Universal ตาม type
   * @param paymentType ประเภทการชำระเงิน ('card', 'promptpay', 'mobile_banking')
   * @param data ข้อมูลการชำระเงิน
   * @param options ตัวเลือกเพิ่มเติม เช่น platformType สำหรับ mobile banking
   */
  async createPaymentByType(
    paymentType: string,
    data: CreateChargeData,
    options?: { platformType?: string }
  ): Promise<ChargeResponse> {
    try {
      // Validate common required fields
      if (!data.amount || !data.currency || !data.returnUri || !data.description) {
        throw new Error('Missing required fields: amount, currency, returnUri, and description are required');
      }

      if (data.amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      switch (paymentType) {
        case 'promptpay':
          return await this.createPromptPayPayment(data);

        case 'mobile_banking':
          if (!options?.platformType) {
            throw new Error('platformType is required for mobile banking');
          }
          const validPlatforms = ['scb', 'bay', 'ktb', 'bbl', 'kbank', 'ttb', 'gsb', 'uob'];
          if (!validPlatforms.includes(options.platformType)) {
            throw new Error(`Invalid platformType. Must be one of: ${validPlatforms.join(', ')}`);
          }
          return await this.createMobileBankingPayment(data, options.platformType);

        case 'card':
          return await this.createCharge(data);

        default:
          throw new Error(`Unsupported payment type: ${paymentType}. Supported types: card, promptpay, mobile_banking`);
      }
    } catch (error) {
      throw new Error(`Failed to create payment by type: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createCharge(data: CreateChargeData): Promise<ChargeResponse> {
    try {
      if (!data.customer) {
        throw new Error('customer is required for card payment');
      }

      const charge = await this.omise.charges.create({
        amount: data.amount,
        currency: data.currency,
        customer: data.customer,
        return_uri: data.returnUri,
        description: data.description,
      });

      //TODO: บันทึกข้อมูล charge ลงในฐานข้อมูลถ้าจำเป็น

      return {
        id: charge.id,
        amount: charge.amount,
        currency: charge.currency,
        status: charge.status,
        description: charge.description,
      } as ChargeResponse;
    } catch (error) {
      throw new Error(`Failed to create charge: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * สร้าง Omise token จากข้อมูลบัตร
   * คืนค่าเป็น BuyerPaymentData (เก็บ token id และ card id)
   */
  async createToken(data: CreateBuyerPaymentData): Promise<BuyerPaymentData> {
    try {
      // Validate input data
      if (!data.userId || !data.email || !data.card) {
        throw new Error('Missing required data: userId, email, and card information are required');
      }

      // Check if user exists before creating FinanceProfile
      const userExists = await this.prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!userExists) {
        throw new Error(`User with ID ${data.userId} does not exist`);
      }

      const token = await this.omise.tokens.create({
        card: {
          name: data.card.name,
          number: data.card.number,
          expiration_month: data.card.expiration_month,
          expiration_year: data.card.expiration_year,
          security_code: data.card.security_code,
          city: data.card.city,
          postal_code: data.card.postal_code,
        },
      });

      const customer = await this.omise.customers.create({
        email: data.email,
        card: token.id,
      });

      // Ensure user has a FinanceProfile or create one
      let financeProfile = await this.prisma.financeProfile.findUnique({
        where: { userId: data.userId },
      });

      if (!financeProfile) {
        financeProfile = await this.prisma.financeProfile.create({
          data: {
            id: customer.id,
            userId: data.userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      // Map card brand from Omise format to our enum
      const mapCardBrand = (brand: string): CardBrand => {
        const brandMap: Record<string, CardBrand> = {
          'Visa': CardBrand.VISA,
          'MasterCard': CardBrand.MASTERCARD,
          'JCB': CardBrand.JCB,
          'American Express': CardBrand.AMERICAN_EXPRESS,
          'Discover': CardBrand.DISCOVER,
        };
        return brandMap[brand] || CardBrand.VISA; // Default to VISA if unknown
      };

      // Get the card information from the token response
      const cardInfo = token.card;

      if (!cardInfo) {
        throw new Error('Card information not found in token response');
      }

      // Save card information to database
      await this.prisma.card.create({
        data: {
          id: cardInfo.id,
          financeProfileId: financeProfile.id,
          brand: mapCardBrand(cardInfo.brand),
          lastDigits: cardInfo.last_digits,
          expirationMonth: cardInfo.expiration_month,
          expirationYear: cardInfo.expiration_year,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return {
        id: customer.id,
        userId: data.userId,
        email: data.email,
      } as BuyerPaymentData;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create token: ${error.message} - Stack: ${error.stack}`);
      } else {
        throw new Error(`Failed to create token: ${JSON.stringify(error)}`);
      }
    }
  }

  /**
   * ดึงข้อมูล capability จาก Omise API
   */
  async getCapability(): Promise<CapabilityResponse> {
    try {
      // ใช้ public key ในการเรียก capability endpoint
      const response = await fetch('https://api.omise.co/capability', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(process.env.OMISE_PUBLIC_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const capability = await response.json();
      return capability as CapabilityResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get capability: ${error.message}`);
      } else {
        throw new Error(`Failed to get capability: ${JSON.stringify(error)}`);
      }
    }
  }

  /**
   * คืนเงินจาก charge
   */
  async refundCharge(chargeId: string, amount?: number): Promise<import("@business/interfaces/buyer-payment.interfaces").RefundResponse> {
    try {
      if (!chargeId) {
        throw new Error('chargeId is required');
      }

      const refundData: any = {};
      if (amount) {
        refundData.amount = amount; // Amount in smallest currency unit (satang)
      }

      // Use charges.createRefund to create a refund
      const refund = await this.omise.charges.createRefund(chargeId, refundData);

      return {
        id: refund.id,
        object: refund.object,
        amount: refund.amount,
        currency: refund.currency,
        charge: refund.charge,
        transaction: refund.transaction,
        created: refund.created_at,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to refund charge: ${error.message}`);
      } else {
        throw new Error(`Failed to refund charge: ${JSON.stringify(error)}`);
      }
    }
  }
}
