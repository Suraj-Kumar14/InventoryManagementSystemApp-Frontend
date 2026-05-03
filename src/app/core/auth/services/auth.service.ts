import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { TokenService } from './token.service';
import {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  OtpVerificationRequest,
  RegisterRequest,
  ResetPasswordRequest,
  User,
} from '../models/auth.models';
import { environment } from '../../../../environments/environment';
import { UserRole, API_ENDPOINTS } from '../../../shared/config/app-config';
import { ChangePasswordRequest, UpdateProfileRequest, UserProfile } from '../../http/backend.models';

interface BackendLoginResponse {
  accessToken: string;
  refreshToken: string;
}

interface RegisterResponse {
  userId: number | null;
  message: string;
}

interface MessageResponse {
  message: string;
}

interface UserListResponse {
  content?: UserProfile[];
  users?: UserProfile[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiGatewayUrl || environment.apiUrl;
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  readonly isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private readonly isLoadingSubject = new BehaviorSubject<boolean>(false);
  readonly isLoading$ = this.isLoadingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) {
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    if (!this.tokenService.hasValidToken()) {
      this.logoutLocal();
      return;
    }

    const restoredUser = this.tokenService.getUser() ?? this.tokenService.decodeToken();
    if (!restoredUser) {
      this.logoutLocal();
      return;
    }

    this.currentUserSubject.next(restoredUser);
    this.isAuthenticatedSubject.next(true);
    this.tokenService.setUser(restoredUser);

    this.tokenService.currentUser$.subscribe((user) => {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(!!user && this.tokenService.hasValidToken());
    });
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.isLoadingSubject.next(true);

    return this.http.post<BackendLoginResponse>(`${this.apiUrl}${API_ENDPOINTS.AUTH.LOGIN}`, credentials).pipe(
      tap((response) => {
        this.tokenService.setToken(response.accessToken);
        if (response.refreshToken) {
          this.tokenService.setRefreshToken(response.refreshToken);
        }
        this.isAuthenticatedSubject.next(true);
      }),
      switchMap((response) =>
        this.getProfile().pipe(
          map((profile) => {
            const user = this.mapProfileToUser(profile);
            this.tokenService.setUser(user);
            return {
              token: response.accessToken,
              refreshToken: response.refreshToken,
              user,
            };
          })
        )
      ),
      catchError((error) => {
        this.logoutLocal();
        return throwError(() => error);
      }),
      finalize(() => this.isLoadingSubject.next(false)),
    );
  }

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    this.isLoadingSubject.next(true);

    return this.http
      .post<RegisterResponse>(`${this.apiUrl}${API_ENDPOINTS.AUTH.REGISTER}`, userData)
      .pipe(finalize(() => this.isLoadingSubject.next(false)));
  }

  verifyOtp(payload: OtpVerificationRequest): Observable<RegisterResponse> {
    this.isLoadingSubject.next(true);
    return this.http
      .post<RegisterResponse>(`${this.apiUrl}${API_ENDPOINTS.AUTH.VERIFY_OTP}`, payload)
      .pipe(finalize(() => this.isLoadingSubject.next(false)));
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<MessageResponse> {
    this.isLoadingSubject.next(true);
    return this.http
      .post<MessageResponse>(`${this.apiUrl}${API_ENDPOINTS.AUTH.FORGOT_PASSWORD}`, payload)
      .pipe(finalize(() => this.isLoadingSubject.next(false)));
  }

  resetPassword(payload: ResetPasswordRequest): Observable<MessageResponse> {
    this.isLoadingSubject.next(true);
    return this.http
      .post<MessageResponse>(`${this.apiUrl}${API_ENDPOINTS.AUTH.RESET_PASSWORD}`, payload)
      .pipe(finalize(() => this.isLoadingSubject.next(false)));
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}${API_ENDPOINTS.AUTH.PROFILE}`);
  }

  startGoogleLogin(): void {
    window.location.href = `${this.apiUrl}${API_ENDPOINTS.AUTH.GOOGLE_LOGIN}`;
  }

  completeOAuthLogin(accessToken: string, refreshToken: string): Observable<User> {
    this.tokenService.setToken(accessToken);
    if (refreshToken) {
      this.tokenService.setRefreshToken(refreshToken);
    }
    this.isAuthenticatedSubject.next(true);

    return this.getProfile().pipe(
      map((profile) => {
        const user = this.mapProfileToUser(profile);
        this.tokenService.setUser(user);
        return user;
      }),
      catchError((error) => {
        this.logoutLocal();
        return throwError(() => error);
      }),
    );
  }

  refreshCurrentUser(): Observable<User | null> {
    if (!this.tokenService.hasValidToken()) {
      this.logoutLocal();
      return of(null);
    }

    return this.getProfile().pipe(
      map((profile) => {
        const user = this.mapProfileToUser(profile);
        this.tokenService.setUser(user);
        this.isAuthenticatedSubject.next(true);
        return user;
      }),
      catchError((error) => {
        this.logoutLocal();
        return throwError(() => error);
      }),
    );
  }

  updateProfile(payload: UpdateProfileRequest): Observable<UserProfile> {
    return this.http
      .put<UserProfile>(`${this.apiUrl}${API_ENDPOINTS.AUTH.UPDATE_PROFILE}`, payload)
      .pipe(
        tap((profile) => {
          this.tokenService.setUser(this.mapProfileToUser(profile));
        })
      );
  }

  changePassword(payload: ChangePasswordRequest): Observable<string> {
    return this.http.put(`${this.apiUrl}${API_ENDPOINTS.AUTH.CHANGE_PASSWORD}`, payload, {
      responseType: 'text',
    });
  }

  getUsers(): Observable<UserProfile[]> {
    return this.http
      .get<UserProfile[] | UserListResponse>(`${this.apiUrl}${API_ENDPOINTS.AUTH.USERS}`)
      .pipe(map((response) => this.normalizeUsersResponse(response)));
  }

  activateUser(id: number): Observable<string> {
    return this.http.put(`${this.apiUrl}${API_ENDPOINTS.AUTH.ACTIVATE_USER(id)}`, {}, {
      responseType: 'text',
    });
  }

  deactivateUser(id: number): Observable<string> {
    return this.http.put(`${this.apiUrl}${API_ENDPOINTS.AUTH.DEACTIVATE_USER(id)}`, {}, {
      responseType: 'text',
    });
  }

  logout(): Observable<void> {
    const token = this.tokenService.getToken();
    if (!token) {
      this.logoutLocal();
      return of(void 0);
    }

    return this.http.post(`${this.apiUrl}${API_ENDPOINTS.AUTH.LOGOUT}`, {}, { responseType: 'text' }).pipe(
      map(() => void 0),
      catchError(() => of(void 0)),
      tap(() => this.logoutLocal()),
    );
  }

  logoutLocal(): void {
    this.tokenService.clear();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.isLoadingSubject.next(false);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value && this.tokenService.hasValidToken();
  }

  hasRole(role: UserRole | UserRole[]): boolean {
    const user = this.currentUserSubject.value;
    if (!user) {
      return false;
    }

    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const requiredRoles = Array.isArray(role) ? role : [role];
    return requiredRoles.includes(user.role);
  }

  getUserRole(): UserRole | null {
    return this.currentUserSubject.value?.role || null;
  }

  getUserId(): number | null {
    return this.currentUserSubject.value?.userId ?? null;
  }

  getFirstName(name?: string | null, email?: string | null): string {
    const source = name?.trim() || email?.trim() || 'User';
    const base = !name?.trim() && source.includes('@') ? source.split('@')[0] : source;
    const firstName = base.split(/\s+/)[0]?.trim();
    return firstName || 'User';
  }

  isTokenValid(): boolean {
    return this.tokenService.hasValidToken();
  }

  private mapProfileToUser(profile: UserProfile): User {
    return {
      userId: profile.userId,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      phone: profile.phone,
      department: profile.department,
      isActive: profile.isActive,
      createdAt: profile.createdAt,
    };
  }

  private normalizeUsersResponse(response: UserProfile[] | UserListResponse): UserProfile[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.content)) {
      return response.content;
    }

    if (Array.isArray(response?.users)) {
      return response.users;
    }

    return [];
  }
}
