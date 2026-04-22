import { Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import { environment } from "../../../environments/environment";
import { TokenService } from "./token.service";
import { AuthResponse, LoginRequest, RegisterRequest, User } from "../models";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly base = `${environment.apiUrl}/auth/user`;
  private readonly stepUpBase = `${environment.apiUrl}/api/v1/auth`;

  private _user = signal<User | null>(
    this.normalizeUser(this.tokenSvc.getUser<User>()) ??
      this.buildUserFromToken(),
  );
  readonly user = this._user.asReadonly();

  constructor(
    private http: HttpClient,
    private tokenSvc: TokenService,
    private router: Router,
  ) {
    const user = this._user();
    if (user) {
      this.persistUser(user);
    }
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/login`, req)
      .pipe(tap((res) => this.applySession(res)));
  }

  /**
   * Step 1: Send OTP for registration
   * Backend returns plain text
   */
  registerRequest(req: RegisterRequest): Observable<string> {
    return this.http.post(`${this.base}/register-request`, req, {
      responseType: "text",
    });
  }

  /**
   * Step 2: Verify registration OTP and create account
   * Backend returns AuthResponse JSON
   */
  registerUser(email: string, otp: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${this.base}/register-user?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`,
        null,
      )
      .pipe(tap((res) => this.applySession(res)));
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(["/auth/login"]);
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

  /**
   * Forgot password step 1
   * Backend returns plain text
   */
  forgotPasswordRequest(email: string): Observable<string> {
    return this.http.post(
      `${this.base}/forgot-password/request?email=${encodeURIComponent(email)}`,
      null,
      { responseType: "text" },
    );
  }

  /**
   * Forgot password step 2
   * Backend returns plain text
   */
  forgotPasswordVerify(email: string, otp: string): Observable<string> {
    return this.http.post(
      `${this.base}/forgot-password/verify?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`,
      null,
      { responseType: "text" },
    );
  }

  /**
   * Forgot password step 3
   * Backend returns plain text
   */
  resetPassword(email: string, password: string): Observable<string> {
    return this.http.post(
      `${this.base}/forgot-password/reset?email=${encodeURIComponent(email)}&newPassword=${encodeURIComponent(password)}`,
      null,
      { responseType: "text" },
    );
  }

  /**
   * Optional aliases for old component names if some files still use them
   */
  register(req: RegisterRequest): Observable<string> {
    return this.registerRequest(req);
  }

  verifyEmailOtp(email: string, otp: string): Observable<AuthResponse> {
    return this.registerUser(email, otp);
  }

  forgotPassword(email: string): Observable<string> {
    return this.forgotPasswordRequest(email);
  }

  verifyForgotPasswordOtp(email: string, otp: string): Observable<string> {
    return this.forgotPasswordVerify(email, otp);
  }

  resendRegistrationOtp(): Observable<never> {
    throw new Error(
      "Registration OTP resend is not available in the current backend controller.",
    );
  }

  triggerStepUpOtp(actionContext: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.stepUpBase}/step-up/trigger`,
      { actionContext },
    );
  }

  verifyStepUpOtp(
    otp: string,
    actionContext: string,
  ): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(
      `${this.stepUpBase}/step-up/verify`,
      { otp, actionContext },
    );
  }

  ensureCurrentUserLoaded(): Observable<User | null> {
    const user = this._user();
    if (user) return of(user);
    if (!this.isLoggedIn()) return of(null);

    const tokenUser = this.buildUserFromToken();
    if (!tokenUser) return of(null);

    this.persistUser(tokenUser);
    return of(tokenUser);
  }

  clearSession(): void {
    this.tokenSvc.clear();
    this._user.set(null);
  }

  applySession(res: unknown): void {
    const session = this.extractSession(res);
    if (!session) return;

    if (session.accessToken) {
      this.tokenSvc.setToken(session.accessToken);
    }
    if (session.refreshToken) {
      this.tokenSvc.setRefreshToken(session.refreshToken);
    }
    if (session.accessToken && !session.user) {
      this.tokenSvc.clearUser();
      this._user.set(null);
    }
    if (session.user) {
      this.persistUser(this.normalizeUser(session.user) ?? session.user);
    }
  }

  redirectAfterLogin(replaceUrl = false): void {
    if (this.isLoggedIn() || this._user()) {
      this.router.navigate(["/dashboard"], { replaceUrl });
    }
  }

  getGoogleLoginUrl(): string {
    return `${environment.apiUrl}/oauth2/authorization/google`;
  }

  private extractSession(res: unknown): Partial<AuthResponse> | null {
    const record = this.extractSessionRecord(res);
    if (!record) return null;

    const accessToken =
      this.readString(record, "accessToken") ??
      this.readString(record, "token");
    const refreshToken = this.readString(record, "refreshToken");
    const tokenType = this.readString(record, "tokenType");
    const expiresIn =
      typeof record["expiresIn"] === "number" ? record["expiresIn"] : undefined;
    const user = this.isUser(record["user"]) ? record["user"] : undefined;

    if (!accessToken && !refreshToken && !user) {
      return null;
    }

    return { accessToken, refreshToken, tokenType, expiresIn, user };
  }

  private extractSessionRecord(res: unknown): Record<string, unknown> | null {
    if (!res || typeof res !== "object") return null;

    const root = res as Record<string, unknown>;
    if (this.looksLikeSession(root)) {
      return root;
    }

    const data = root["data"];
    if (
      data &&
      typeof data === "object" &&
      this.looksLikeSession(data as Record<string, unknown>)
    ) {
      return data as Record<string, unknown>;
    }

    return null;
  }

  private looksLikeSession(value: Record<string, unknown>): boolean {
    return ["accessToken", "token", "refreshToken", "user"].some(
      (key) => key in value,
    );
  }

  private persistUser(user: User): void {
    this.tokenSvc.setUser(user);
    this._user.set(user);
  }

  private normalizeUser(user: User | null | undefined): User | null {
    if (!user) return null;

    const normalized = { ...user };
    const fullName =
      normalized.fullName?.trim() ||
      `${normalized.firstName ?? ""} ${normalized.lastName ?? ""}`.trim();

    if ((!normalized.firstName || !normalized.lastName) && fullName) {
      const parts = fullName.split(/\s+/);
      normalized.firstName = normalized.firstName || parts[0] || "";
      normalized.lastName = normalized.lastName || parts.slice(1).join(" ");
    }

    if (!normalized.fullName) {
      normalized.fullName =
        `${normalized.firstName ?? ""} ${normalized.lastName ?? ""}`.trim();
    }

    return normalized;
  }

  private buildUserFromToken(): User | null {
    const payload = this.readTokenPayload();
    if (!payload) return null;

    const email =
      this.readString(payload, "email") ?? this.readString(payload, "sub");
    if (!email) return null;

    return this.normalizeUser({
      email,
      firstName: "",
      lastName: "",
      fullName:
        this.readString(payload, "fullName") ??
        this.readString(payload, "name"),
      role:
        this.readString(payload, "role") ??
        this.readAuthority(payload["authorities"]),
      active: true,
    } as User);
  }

  private readTokenPayload(): Record<string, unknown> | null {
    const token = this.tokenSvc.getToken();
    if (!token) return null;

    try {
      return JSON.parse(atob(token.split(".")[1])) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private readAuthority(value: unknown): string | undefined {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
    if (Array.isArray(value)) {
      const first = value.find(
        (item) => typeof item === "string" && item.trim(),
      );
      return typeof first === "string" ? first : undefined;
    }
    return undefined;
  }

  private readString(
    record: Record<string, unknown>,
    key: string,
  ): string | undefined {
    const value = record[key];
    return typeof value === "string" && value.trim() ? value : undefined;
  }

  private isUser(value: unknown): value is User {
    return !!value && typeof value === "object" && "email" in value;
  }
}
