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
  SocialAuthRequest,
  SocialAuthResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  CreateSocialUserData,
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

  async loginWithGoogle(
    request: SocialAuthRequest
  ): Promise<SocialAuthResponse> {
    // 1. Verify Google token and get user info
    const googleUserInfo = await this.verifyGoogleToken(request.accessToken);

    if (!googleUserInfo) {
      throw new BusinessError("Invalid Google token", "UNAUTHORIZED");
    }

    // 2. Find or create user
    const result = await this.findOrCreateSocialUser(
      AuthProvider.GOOGLE,
      googleUserInfo.sub, // Google user ID
      googleUserInfo.email,
      googleUserInfo.name || googleUserInfo.email,
      googleUserInfo.picture,
      request
    );

    return result;
  }

  async loginWithFacebook(
    request: SocialAuthRequest
  ): Promise<SocialAuthResponse> {
    // 1. Verify Facebook token and get user info
    const facebookUserInfo = await this.verifyFacebookToken(
      request.accessToken
    );

    if (!facebookUserInfo) {
      throw new BusinessError("Invalid Facebook token", "UNAUTHORIZED");
    }

    // 2. Find or create user
    const result = await this.findOrCreateSocialUser(
      AuthProvider.FACEBOOK,
      facebookUserInfo.id,
      facebookUserInfo.email,
      facebookUserInfo.name || facebookUserInfo.email,
      facebookUserInfo.picture?.data?.url,
      request
    );

    return result;
  }

  async loginWithLine(request: SocialAuthRequest): Promise<SocialAuthResponse> {
    // 1. Verify LINE token and get user info
    const lineUserInfo = await this.verifyLineToken(request.accessToken);

    if (!lineUserInfo) {
      throw new BusinessError("Invalid LINE token", "UNAUTHORIZED");
    }

    // 2. Find or create user
    const result = await this.findOrCreateSocialUser(
      AuthProvider.LINE,
      lineUserInfo.userId,
      lineUserInfo.email,
      lineUserInfo.displayName || lineUserInfo.email || "LINE User",
      lineUserInfo.pictureUrl,
      request
    );

    return result;
  }

  async forgotPassword(
    request: ForgotPasswordRequest
  ): Promise<ForgotPasswordResponse> {
    // 1. Find user by email
    const user = await this.userRepository.findByEmail(request.email);

    if (!user) {
      // Don't reveal if email exists for security
      return {
        message:
          "If the email exists, a password reset link has been sent.",
      };
    }

    // 2. Generate reset token (using OTP service)
    await this.otpService.requestOTPEmail(user.id, request.email);

    return {
      message: "If the email exists, a password reset link has been sent.",
    };
  }

  async resetPassword(
    request: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> {
    // 1. Validate passwords match
    if (request.newPassword !== request.confirmPassword) {
      throw new BusinessError("Passwords do not match", "VALIDATION_ERROR");
    }

    // 2. Verify OTP token and PIN
    const otpVerification = await this.otpService.verifyOTPEmail(
      request.token,
      request.pin
    );

    if (!otpVerification || otpVerification.status !== 'success') {
      throw new BusinessError("Invalid or expired OTP", "UNAUTHORIZED");
    }

    if (!otpVerification.userId) {
      throw new BusinessError("Invalid OTP token", "UNAUTHORIZED");
    }

    // 3. Hash new password
    const hashedPassword = await this.hashPassword(request.newPassword);

    // 4. Update user password
    await this.userRepository.updatePassword(otpVerification.userId, hashedPassword);

    return {
      message: "Password has been reset successfully.",
    };
  }

  // Helper methods for social authentication
  private async verifyGoogleToken(token: string): Promise<any> {
    try {
      // Call Google's API to verify token
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return null;
    }
  }

  private async verifyFacebookToken(token: string): Promise<any> {
    try {
      // Call Facebook's API to verify token and get user info
      const response = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return null;
    }
  }

  private async verifyLineToken(token: string): Promise<any> {
    try {
      // Call LINE's API to verify token
      const response = await fetch("https://api.line.me/v2/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return null;
    }
  }

  private async findOrCreateSocialUser(
    provider: AuthProvider,
    providerId: string,
    email: string | undefined,
    name: string,
    avatarUrl: string | undefined,
    request: SocialAuthRequest
  ): Promise<SocialAuthResponse> {
    // 1. Try to find existing user by provider ID
    let userAuth = await this.userRepository.findByProviderId(
      provider,
      providerId
    );

    let isNewUser = false;

    if (!userAuth) {
      // 2. Create new user
      isNewUser = true;
      const [firstName, ...lastNameParts] = name.split(" ");
      const lastName = lastNameParts.join(" ");

      const userData: CreateSocialUserData = {
        email: email,
        roles: [UserRole.BUYER],
        profile: {
          firstName: firstName || name,
          lastName: lastName || "",
          avatarUrl: avatarUrl,
        },
        authentication: {
          provider: provider,
          providerId: providerId,
          accessToken: request.accessToken,
        },
      };

      userAuth = await this.userRepository.createSocialUser(userData);
    }

    // 3. Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      userAuth.user?.id || userAuth.id
    );

    // 4. Store refresh token session
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.refreshSessionRepository.create({
      userId: userAuth.user?.id || userAuth.id,
      token: refreshToken,
      expiresAt,
    });

    // 5. Handle user device information
    if (request.deviceInfo && request.firebaseToken) {
      const userId = userAuth.user?.id || userAuth.id;
      const existingDevice = await this.userRepository.findUserDevice(
        userId,
        request.deviceInfo.id
      );

      if (!existingDevice) {
        await this.userRepository.createUserDevice({
          userId: userId,
          deviceInfoId: request.deviceInfo.id,
          firebaseToken: request.firebaseToken,
        });
      } else {
        await this.userRepository.updateUserDeviceFirebaseToken({
          firebaseToken: request.firebaseToken,
          userId: userId,
          deviceId: request.deviceInfo.id,
        });
      }
    }

    return {
      userId: userAuth.user?.id || userAuth.id,
      fullName: name,
      accessToken,
      refreshToken,
      isNewUser,
    };
  }
}
