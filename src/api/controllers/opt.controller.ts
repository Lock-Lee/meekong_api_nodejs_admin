import { injectable } from "inversify";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import { Logger } from "../../shared/utils/logger";
import { IOTPService } from "@business/interfaces/otp.interfaces";

@injectable()
export class OTPController {
  private OTPService: IOTPService;
  constructor() {
    this.OTPService = container.get<IOTPService>(TYPES.OTPService);
  }

  async requestOTPSMS(req: any, res: any): Promise<void> {
    try {
      Logger.info("Requesting OTP SMS", { requestId: req.id, body: req.body });

      const { msisdn } = req.body;

      if (!msisdn) {
        Logger.warn("Missing msisdn in request body", { requestId: req.id });
        return res.status(400).json({ message: "msisdn is required" });
      }

      const otpResponse = await this.OTPService.requestOTPSMS(msisdn);

      Logger.info("OTP SMS requested successfully", {
        requestId: req.id,
        otpResponse
      });

      return res.status(200).json(otpResponse);
    } catch (error) {
      Logger.error("Error requesting OTP SMS", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return res.status(500).json({ message: "Failed to request OTP SMS" });
    }
  }

  async verifyOTPSMS(req: any, res: any): Promise<void> {
    try {
      Logger.info("Verifying OTP SMS", { requestId: req.id, body: req.body });

      const { token, pin } = req.body;

      if (!token || !pin) {
        Logger.warn("Missing token or pin in request body", { requestId: req.id });
        return res.status(400).json({ message: "token and pin are required" });
      }

      const verifyResponse = await this.OTPService.verifyOTPSMS(token, pin);

      Logger.info("OTP SMS verified successfully", {
        requestId: req.id,
        verifyResponse
      });

      return res.status(200).json(verifyResponse);
    } catch (error) {
      Logger.error("Error verifying OTP SMS", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return res.status(500).json({ message: "Failed to verify OTP SMS" });
    }
  }

  async requestOTPEmail(req: any, res: any): Promise<void> {
    try {
      Logger.info("Requesting OTP Email", { requestId: req.id, body: req.body });

      const { userId, email } = req.body;

      if (!userId || !email) {
        Logger.warn("Missing userId or email in request body", { requestId: req.id });
        return res.status(400).json({ message: "userId and email are required" });
      }

      const otpResponse = await this.OTPService.requestOTPEmail(userId, email);

      Logger.info("OTP Email requested successfully", {
        requestId: req.id,
        otpResponse
      });

      return res.status(200).json(otpResponse);
    } catch (error) {
      Logger.error("Error requesting OTP Email", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return res.status(500).json({ message: "Failed to request OTP Email" });
    }
  }

  async verifyOTPEmail(req: any, res: any): Promise<void> {
    try {
      Logger.info("Verifying OTP Email", { requestId: req.id, body: req.body });

      const { token, pin } = req.body;

      if (!token || !pin) {
        Logger.warn("Missing token or pin in request body", { requestId: req.id });
        return res.status(400).json({ message: "token and pin are required" });
      }

      const verifyResponse = await this.OTPService.verifyOTPEmail(token, pin);

      Logger.info("OTP Email verified successfully", {
        requestId: req.id,
        verifyResponse
      });

      return res.status(200).json(verifyResponse);
    } catch (error) {
      Logger.error("Error verifying OTP Email", {
        requestId: req.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return res.status(500).json({ message: "Failed to verify OTP Email" });
    }
  }
}