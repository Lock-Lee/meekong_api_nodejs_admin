import { injectable } from "inversify";
import jwt from "jsonwebtoken";
import authConfig from "@config/auth.config";
import { UnauthorizedError } from "../../shared/errors/business.errors";
import { ITokenService } from "../interfaces/auth.interfaces";

@injectable()
export class TokenService implements ITokenService {
    generateAccessToken(userId: string): string {
        return jwt.sign(
            { userId },
            authConfig.secret,
            { expiresIn: authConfig.secret_expires_in as any }
        );
    }

    generateRefreshToken(userId: string): string {
        return jwt.sign(
            { userId },
            authConfig.refresh_secret,
            { expiresIn: authConfig.refresh_secret_expires_in as any }
        );
    }

    verifyAccessToken(token: string): { userId: string } {
        try {
            const decoded = jwt.verify(token, authConfig.secret) as { userId: string };
            return { userId: decoded.userId };
        } catch {
            throw new UnauthorizedError("Invalid or expired access token");
        }
    }

    verifyRefreshToken(token: string): { userId: string } {
        try {
            const decoded = jwt.verify(token, authConfig.refresh_secret) as { userId: string };
            return { userId: decoded.userId };
        } catch {
            throw new UnauthorizedError("Invalid or expired refresh token");
        }
    }
}
