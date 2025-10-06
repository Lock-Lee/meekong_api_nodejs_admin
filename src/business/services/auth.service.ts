import { injectable, inject } from "inversify";
import bcrypt from "bcryptjs";
import { TYPES } from "../../shared/types/service.types";
import { BusinessError } from "../../shared/errors/business.errors";
import { UserRole, AuthProvider } from "../../../generated/prisma";
import {
  IAuthService,
  ITokenService,
  IUserRepository,
  IRefreshSessionRepository,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RegisterResponse,
  RefreshTokenResponse,
  CreateUserData,
  LoginByPhoneResponse,
  LoginByPhoneRequest,
} from "../interfaces/auth.interfaces";
import { IOTPService } from "@business/interfaces/otp.interfaces";

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject(TYPES.TokenService) private tokenService: ITokenService,
    @inject(TYPES.UserRepository) private userRepository: IUserRepository,
    @inject(TYPES.RefreshSessionRepository)
    private refreshSessionRepository: IRefreshSessionRepository,
    @inject(TYPES.OTPService) private otpService: IOTPService
  ) {}

  async login(request: LoginRequest): Promise<LoginResponse> {
    // 1. Find user with authentication details
    const userAuth = await this.userRepository.findByEmailWithAuth(
      request.email
    );

    if (!userAuth || !userAuth.passwordHash) {
      throw new BusinessError("Invalid credentials", "UNAUTHORIZED");
    }

    // 2. Validate password
    const isPasswordValid = await this.validatePassword(
      request.password,
      userAuth.passwordHash
    );
    if (!isPasswordValid) {
      throw new BusinessError("Invalid credentials", "UNAUTHORIZED");
    }

    // 3. Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      userAuth.user.id
    );

    // 4. Store refresh token session
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    await this.refreshSessionRepository.create({
      userId: userAuth.user.id,
      token: refreshToken,
      expiresAt,
    });

    // 5. Handle user device information
    if (request.deviceInfo && request.firebaseToken) {
      const existingDevice = await this.userRepository.findUserDevice(
        userAuth.user.id,
        request.deviceInfo.id
      );

      if (!existingDevice) {
        await this.userRepository.createUserDevice({
          userId: userAuth.user.id,
          deviceInfoId: request.deviceInfo.id,
          firebaseToken: request.firebaseToken,
        });
      } else {
        await this.userRepository.updateUserDeviceFirebaseToken({
          firebaseToken: request.firebaseToken,
          userId: userAuth.user.id,
          deviceId: request.deviceInfo.id,
        });
      }
    }

    return {
      userId: userAuth.user.id,
      fullName: `${userAuth.user.profile?.firstName || ""} ${
        userAuth.user.profile?.lastName || ""
      }`.trim(),
      accessToken,
      refreshToken,
    };
  }

  async loginByPhone(
    request: LoginByPhoneRequest
  ): Promise<LoginByPhoneResponse> {
    // 1. Find user with authentication details

    const userAuth = await this.userRepository.findByPhone(request.phone);

    if (!userAuth) {
      throw new BusinessError("User not found", "UNAUTHORIZED");
    }
    // 2. Send OTP SMS
    await this.otpService.verifyOTPSMS(request.token, request.pin);

    // 3. Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      userAuth.id
    );

    // 4. Store refresh token session
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    await this.refreshSessionRepository.create({
      userId: userAuth.id,
      token: refreshToken,
      expiresAt,
    });

    // 5. Handle user device information
    if (request.deviceInfo && request.firebaseToken) {
      const existingDevice = await this.userRepository.findUserDevice(
        userAuth.id,
        request.deviceInfo.id
      );

      if (!existingDevice) {
        await this.userRepository.createUserDevice({
          userId: userAuth.id,
          deviceInfoId: request.deviceInfo.id,
          firebaseToken: request.firebaseToken,
        });
      } else {
        await this.userRepository.updateUserDeviceFirebaseToken({
          firebaseToken: request.firebaseToken,
          userId: userAuth.id,
          deviceId: request.deviceInfo.id,
        });
      }
    }

    return {
      userId: userAuth.id,
      fullName: `${userAuth.profile?.firstName || ""} ${
        userAuth.profile?.lastName || ""
      }`.trim(),
      accessToken,
      refreshToken,
    };
  }

  async register(request: RegisterRequest): Promise<RegisterResponse> {
    // 1. Validate business rules
    if (request.password !== request.password_confirmation) {
      throw new BusinessError(
        "Password confirmation does not match",
        "VALIDATION_ERROR"
      );
    }

    // 2. Check if user already exists
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new BusinessError("Email is already in use", "VALIDATION_ERROR");
    }

    // 3. Hash password
    const hashedPassword = await this.hashPassword(request.password);

    // 4. Create user
    const userData: CreateUserData = {
      email: request.email,
      phone: request.phone,
      roles: [UserRole.BUYER, ...(request.role ? [request.role] : [])],
      profile: {
        firstName: request.email, // Default to email
        lastName: request.phone || "",
      },
      authentication: {
        provider: AuthProvider.PASSWORD,
        providerId: request.email,
        passwordHash: hashedPassword,
      },
    };

    const newUser = await this.userRepository.create(userData);

    return {
      id: newUser.id,
      email: newUser.email,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    if (refreshToken) {
      await this.refreshSessionRepository.revokeByToken(refreshToken);
    }
  }

  async refreshToken(
    userId: string,
    refreshToken: string
  ): Promise<RefreshTokenResponse> {
    // 1. Validate refresh token session
    const session = await this.refreshSessionRepository.findValidSession(
      userId,
      refreshToken
    );
    if (!session) {
      throw new BusinessError(
        "Invalid or expired refresh token",
        "UNAUTHORIZED"
      );
    }

    // 2. Generate new access token
    const newAccessToken = this.tokenService.generateAccessToken(userId);

    return {
      accessToken: newAccessToken,
    };
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async generateTokens(
    userId: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.tokenService.generateAccessToken(userId);
    const refreshToken = this.tokenService.generateRefreshToken(userId);

    return { accessToken, refreshToken };
  }
}
