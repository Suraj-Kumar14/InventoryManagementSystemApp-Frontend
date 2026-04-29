import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { User, JwtPayload } from '../models/auth.models';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly tokenKey = environment.jwt.tokenKey;
  private readonly refreshTokenKey = environment.jwt.refreshTokenKey;

  /**
   * Store JWT token in sessionStorage
   */
  setToken(token: string): void {
    sessionStorage.setItem(this.tokenKey, token);
  }

  /**
   * Retrieve JWT token from sessionStorage
   */
  getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  /**
   * Store refresh token in sessionStorage
   */
  setRefreshToken(refreshToken: string): void {
    sessionStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  /**
   * Retrieve refresh token from sessionStorage
   */
  getRefreshToken(): string | null {
    return sessionStorage.getItem(this.refreshTokenKey);
  }

  /**
   * Check if token exists and is valid
   */
  hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    return !this.isTokenExpired(token);
  }

  /**
   * Check if token has expired
   */
  isTokenExpired(token?: string): boolean {
    const t = token || this.getToken();
    if (!t) {
      return true;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(t);
      const now = Date.now() / 1000;
      const expirationTime = decoded.exp || 0;
      // Consider token expired 60 seconds before actual expiration
      return now > expirationTime - 60;
    } catch (error) {
      console.error('Token decode error:', error);
      return true;
    }
  }

  /**
   * Decode token and extract user info
   */
  decodeToken(): User | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return {
        email: decoded.sub,
        name: decoded.sub,
        role: decoded.role,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear all tokens from storage
   */
  clearTokens(): void {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);
  }

  /**
   * Get token expiration time in seconds
   */
  getTokenExpirationTime(): number | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const expirationTime = (decoded.exp || 0) * 1000;
      const now = Date.now();
      const remainingTime = Math.floor((expirationTime - now) / 1000);
      return Math.max(remainingTime, 0);
    } catch (error) {
      return null;
    }
  }
}
