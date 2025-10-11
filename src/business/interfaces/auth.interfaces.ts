import { AuthProvider, UserRole } from "../../../generated/prisma";

// DTOs
export interface LoginRequest {
  email: string;
  password: string;
  firebaseToken?: string;
  deviceInfo?: {
    id: string;
    name: string;
    type: string;
  };
}

export interface LoginByPhoneRequest {
  phone: string;
  token: string;
  pin: string;
  firebaseToken?: string;
  deviceInfo?: {
    id: string;
    name: string;
    type: string;
  };
}

export interface SocialAuthRequest {
  accessToken: string;
  firebaseToken?: string;
  deviceInfo?: {
    id: string;
    name: string;
    type: string;
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  pin: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  role?: UserRole;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LoginResponse {
  userId: string;
  fullName: string;
  accessToken: string;
  refreshToken: string;
}

export interface LoginByPhoneResponse {
  userId: string;
  fullName: string;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface SocialAuthResponse {
  userId: string;
  fullName: string;
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface UserAuthDetails {
  id: string;
  email: string;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
}

export interface RefreshSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  revoked: boolean;
  createdAt: Date;
}

// Service Interfaces
export interface IAuthService {
  login(request: LoginRequest): Promise<LoginResponse>;
  register(request: RegisterRequest): Promise<RegisterResponse>;
  logout(refreshToken: string): Promise<void>;
  refreshToken(
    userId: string,
    refreshToken: string
  ): Promise<RefreshTokenResponse>;
  validatePassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
  generateTokens(
    userId: string
  ): Promise<{ accessToken: string; refreshToken: string }>;
  loginByPhone(request: LoginByPhoneRequest): Promise<LoginByPhoneResponse>;
  loginWithGoogle(request: SocialAuthRequest): Promise<SocialAuthResponse>;
  loginWithFacebook(request: SocialAuthRequest): Promise<SocialAuthResponse>;
  loginWithLine(request: SocialAuthRequest): Promise<SocialAuthResponse>;
  forgotPassword(request: ForgotPasswordRequest): Promise<ForgotPasswordResponse>;
  resetPassword(request: ResetPasswordRequest): Promise<ResetPasswordResponse>;
}

export interface ITokenService {
  generateAccessToken(userId: string): string;
  generateRefreshToken(userId: string): string;
  verifyAccessToken(token: string): { userId: string };
  verifyRefreshToken(token: string): { userId: string };
}

// Repository Interfaces
export interface IUserRepository {
  findByEmail(email: string): Promise<UserAuthDetails | null>;
  findByEmailWithAuth(email: string): Promise<any>;
  create(userData: CreateUserData): Promise<UserAuthDetails>;
  findById(id: string): Promise<UserAuthDetails | null>;
  createUserDevice(data: CreateUserDeviceData): Promise<any>;
  updateUserDeviceFirebaseToken(
    data: UpdateUserDeviceFirebaseTokenData
  ): Promise<void>;
  findUserDevice(userId: string, deviceId: string): Promise<any>;
  findByPhone(phone: string): Promise<UserAuthDetails | null>;
  findByProviderId(provider: AuthProvider, providerId: string): Promise<any>;
  createSocialUser(userData: CreateSocialUserData): Promise<UserAuthDetails>;
  updateEmail(userId: string, email: string): Promise<void>;
  updatePassword(userId: string, hashedPassword: string): Promise<void>;
}

export interface IRefreshSessionRepository {
  create(sessionData: CreateRefreshSessionData): Promise<RefreshSession>;
  findValidSession(
    userId: string,
    token: string
  ): Promise<RefreshSession | null>;
  revokeByToken(token: string): Promise<void>;
  revokeAllUserSessions(userId: string): Promise<void>;
}

// Data Creation Interfaces
export interface CreateUserData {
  email: string;
  phone?: string;
  roles: UserRole[];
  profile: {
    firstName: string;
    lastName: string;
  };
  authentication: {
    provider: AuthProvider;
    providerId: string;
    passwordHash: string;
  };
}

export interface CreateSocialUserData {
  email?: string;
  phone?: string;
  roles: UserRole[];
  profile: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  authentication: {
    provider: AuthProvider;
    providerId: string;
    accessToken?: string;
    refreshToken?: string;
  };
}

export interface CreateRefreshSessionData {
  userId: string;
  token: string;
  expiresAt: Date;
}

export interface CreateUserDeviceData {
  userId: string;
  deviceInfoId: string;
  firebaseToken?: string;
  deviceId?: string;
}

export interface UpdateUserDeviceFirebaseTokenData {
  deviceId?: string;
  firebaseToken: string;
  userId: string;
}
