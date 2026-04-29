import { UserRole } from '../../../shared/config/app-config';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string | null;
  department?: string | null;
}

export interface OtpVerificationRequest {
  email: string;
  otp: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

export interface User {
  userId?: number;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  department?: string | null;
  isActive?: boolean;
  createdAt?: string;
}

export interface JwtPayload {
  sub: string;
  role: UserRole;
  type?: string;
  iat: number;
  exp: number;
}

export interface ApiErrorResponse {
  message?: string;
  error?: string;
  status?: number;
  timestamp?: string;
  errors?: Record<string, string>;
}
