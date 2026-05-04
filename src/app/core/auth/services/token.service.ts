import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { User, JwtPayload } from '../models/auth.models';
import { environment } from '../../../../environments/environment';
import { normalizeUserRole } from '../../../shared/config/app-config';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly tokenKey = environment.jwt.tokenKey;
  private readonly refreshTokenKey = environment.jwt.refreshTokenKey;
  private readonly userKey = `${environment.jwt.tokenKey}_user`;
  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.readStoredUser());

  readonly currentUser$ = this.currentUserSubject.asObservable();

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  setRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  removeRefreshToken(): void {
    localStorage.removeItem(this.refreshTokenKey);
  }

  setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  getUser(): User | null {
    return this.currentUserSubject.value;
  }

  removeUser(): void {
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
  }

  hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    return !this.isTokenExpired(token);
  }

  isTokenExpired(token?: string): boolean {
    const value = token || this.getToken();
    if (!value) {
      return true;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(value);
      const now = Date.now() / 1000;
      const expirationTime = decoded.exp || 0;
      return now > expirationTime - 60;
    } catch (error) {
      console.error('Token decode error:', error);
      return true;
    }
  }

  decodeToken(): User | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const normalizedRole = normalizeUserRole(decoded.role);
      if (!normalizedRole) {
        return null;
      }
      return {
        userId: decoded.userId,
        email: decoded.sub,
        name: decoded.sub,
        role: normalizedRole,
      };
    } catch (error) {
      return null;
    }
  }

  clearTokens(): void {
    this.removeToken();
    this.removeRefreshToken();
  }

  clear(): void {
    this.removeToken();
    this.removeRefreshToken();
    this.removeUser();
  }

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

  private readStoredUser(): User | null {
    const rawUser = localStorage.getItem(this.userKey);
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as User;
    } catch {
      localStorage.removeItem(this.userKey);
      return null;
    }
  }
}
