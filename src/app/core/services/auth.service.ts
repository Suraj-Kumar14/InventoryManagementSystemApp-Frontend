import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = `${environment.apiUrl}/api/v1/auth`;

  // Reactive current user signal
  private _user = signal<User | null>(this.tokenSvc.getUser<User>());
  readonly user = this._user.asReadonly();

  constructor(
    private http: HttpClient,
    private tokenSvc: TokenService,
    private router: Router
  ) {}

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, req).pipe(
      tap(res => this.storeSession(res))
    );
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/register`, req).pipe(
      tap(res => this.storeSession(res))
    );
  }

  logout(): void {
    this.tokenSvc.clear();
    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }

  isLoggedIn(): boolean {
    return this.tokenSvc.isTokenValid();
  }

  currentUser(): User | null {
    return this._user();
  }

  hasRole(role: string): boolean {
    return this._user()?.role === role;
  }

  hasAnyRole(...roles: string[]): boolean {
    const userRole = this._user()?.role;
    return userRole ? roles.includes(userRole) : false;
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/forgot-password`, { email });
  }

  verifyForgotPasswordOtp(email: string, otp: string): Observable<{ resetToken: string }> {
    return this.http.post<{ resetToken: string }>(`${this.base}/forgot-password/verify-otp`, { email, otp });
  }

  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/reset-password`, { token, password });
  }

  verifyEmailOtp(email: string, otp: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/verify-otp`, { email, otp }).pipe(
      tap(res => this.storeSession(res))
    );
  }

  resendOtp(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/resend-otp`, { email });
  }

  triggerStepUpOtp(actionContext: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/step-up/trigger`, { actionContext });
  }

  verifyStepUpOtp(otp: string, actionContext: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.base}/step-up/verify`, { otp, actionContext });
  }

  private storeSession(res: AuthResponse): void {
    this.tokenSvc.setToken(res.accessToken);
    this.tokenSvc.setRefreshToken(res.refreshToken);
    this.tokenSvc.setUser(res.user);
    this._user.set(res.user);
  }

  redirectAfterLogin(): void {
    const user = this._user();
    if (!user) return;
    this.router.navigate(['/dashboard']);
  }
}
