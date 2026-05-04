import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, filter, finalize, map, switchMap, take, tap } from 'rxjs/operators';
import { TokenService } from './token.service';
import {
  AuthResponse,
  AdminUpdateUserRequest,
  CreateUserRequest,
  ForgotPasswordRequest,
  LoginRequest,
  OtpVerificationRequest,
  RegisterRequest,
  ResetPasswordRequest,
  User,
} from '../models/auth.models';
import { environment } from '../../../../environments/environment';
import { UserRole, API_ENDPOINTS, normalizeRole } from '../../../shared/config/app-config';
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
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiGatewayUrl || environment.apiUrl;
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  readonly isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private readonly isLoadingSubject = new BehaviorSubject<boolean>(false);
  readonly isLoading$ = this.isLoadingSubject.asObservable();

  private readonly isInitializedSubject = new BehaviorSubject<boolean>(false);
  readonly isInitialized$ = this.isInitializedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) {
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    this.isLoadingSubject.next(true);

    if (!this.tokenService.hasValidToken()) {
      this.logoutLocal();
      this.isInitializedSubject.next(true);
      return;
    }

    const restoredUser = this.tokenService.getUser() ?? this.tokenService.decodeToken();
    if (!restoredUser) {
      this.logoutLocal();
      this.isInitializedSubject.next(true);
      return;
    }

    this.currentUserSubject.next(restoredUser);
    this.isAuthenticatedSubject.next(true);
    this.tokenService.setUser(restoredUser);

    this.tokenService.currentUser$.subscribe((user) => {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(!!user && this.tokenService.hasValidToken());
    });

    this.isLoadingSubject.next(false);
    this.isInitializedSubject.next(true);
  }

  waitUntilInitialized(): Observable<boolean> {
    return this.isInitialized$.pipe(
      filter(Boolean),
      take(1)
    );
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
    this.isLoadingSubject.next(true);
    this.tokenService.setToken(accessToken);
    this.tokenService.setRefreshToken(refreshToken);
    this.isAuthenticatedSubject.next(true);

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
      finalize(() => this.isLoadingSubject.next(false)),
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
    return this.searchUsers();
  }

  searchUsers(filters: { keyword?: string; role?: UserRole | ''; isActive?: boolean | '' } = {}): Observable<UserProfile[]> {
    let params = new HttpParams();
    if (filters.keyword?.trim()) {
      params = params.set('keyword', filters.keyword.trim());
    }
    if (filters.role) {
      params = params.set('role', filters.role);
    }
    if (filters.isActive !== '' && filters.isActive !== undefined) {
      params = params.set('isActive', String(filters.isActive));
    }

    return this.http
      .get<UserProfile[] | UserListResponse>(`${this.apiUrl}${API_ENDPOINTS.AUTH.USERS}`, { params })
      .pipe(map((response) => this.normalizeUsersResponse(response)));
  }

  createUser(payload: CreateUserRequest): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${this.apiUrl}${API_ENDPOINTS.AUTH.USERS}`, payload);
  }

  updateUser(id: number, payload: AdminUpdateUserRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}${API_ENDPOINTS.AUTH.USER_DETAIL(id)}`, payload);
  }

  activateUser(id: number): Observable<string> {
    return this.http.patch(`${this.apiUrl}${API_ENDPOINTS.AUTH.ACTIVATE_USER(id)}`, {}, {
      responseType: 'text',
    });
  }

  deactivateUser(id: number): Observable<string> {
    return this.http.patch(`${this.apiUrl}${API_ENDPOINTS.AUTH.DEACTIVATE_USER(id)}`, {}, {
      responseType: 'text',
    });
  }

  logout(): Observable<void> {
    const token = this.tokenService.getToken();
    if (!token) {
      this.logoutLocal();
      this.router.navigate(['/login']);
      return of(void 0);
    }

    return this.http.post(`${this.apiUrl}${API_ENDPOINTS.AUTH.LOGOUT}`, {}, { responseType: 'text' }).pipe(
      map(() => void 0),
      catchError(() => of(void 0)),
      tap(() => {
        this.logoutLocal();
        this.router.navigate(['/login']);
      }),
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
    return requiredRoles.some((requiredRole) => this.rolesMatch(user.role, requiredRole));
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
    const role = normalizeRole(profile.role);
    if (!role) {
      throw new Error(`Unsupported user role: ${profile.role}`);
    }

    return {
      userId: profile.userId,
      name: profile.name,
      email: profile.email,
      role,
      phone: profile.phone,
      department: profile.department,
      isActive: profile.isActive,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      lastLoginAt: profile.lastLoginAt,
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

  private rolesMatch(actual: UserRole, expected: UserRole): boolean {
    return normalizeRole(actual) === normalizeRole(expected);
  }
}
