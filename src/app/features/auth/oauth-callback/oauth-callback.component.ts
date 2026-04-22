import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="auth-card" style="text-align: center; padding: 3rem 2rem;">
      <div class="spinner spinner-dark" style="width: 48px; height: 48px; border-width: 4px; margin-bottom: 1.5rem;"></div>
      <h2 style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary);">Authenticating...</h2>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 0.5rem;">Please wait while we log you in.</p>
    </div>
  `
})
export class OauthCallbackComponent implements OnInit {
  route    = inject(ActivatedRoute);
  router   = inject(Router);
  auth     = inject(AuthService);
  toast    = inject(ToastService);

  ngOnInit(): void {
    const params = this.readCallbackParams();
    const error = params['error_description'] ?? params['error'];

    if (error) {
      this.toast.error('Google Login Failed', this.humanizeMessage(error));
      this.router.navigate(['/auth/login']);
      return;
    }

    const accessToken = params['accessToken'] ?? params['access_token'] ?? params['token'];
    const refreshToken = params['refreshToken'] ?? params['refresh_token'];
    const user = this.parseUser(params['user']);

    if (!accessToken) {
      this.toast.error('Login Failed', 'No token received from Google');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.auth.applySession({ accessToken, refreshToken, user });
    this.auth.ensureCurrentUserLoaded().subscribe({
      next: () => {
        this.toast.success('Login successful!');
        this.auth.redirectAfterLogin(true);
      }
    });
  }

  private readCallbackParams(): Record<string, string> {
    const params: Record<string, string> = {};
    const queryParams = this.route.snapshot.queryParamMap;

    for (const key of queryParams.keys) {
      const value = queryParams.get(key);
      if (value) {
        params[key] = value;
      }
    }

    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;

    if (hash) {
      const hashParams = new URLSearchParams(hash);
      hashParams.forEach((value, key) => {
        params[key] = value;
      });
    }

    return params;
  }

  private parseUser(rawUser: string | undefined): User | undefined {
    if (!rawUser) return undefined;

    for (const value of [rawUser, this.safeDecode(rawUser)]) {
      if (!value) continue;

      try {
        return JSON.parse(value) as User;
      } catch {
        // Ignore malformed user payloads and fall back to token claims.
      }
    }

    return undefined;
  }

  private safeDecode(value: string): string | null {
    try {
      return decodeURIComponent(value);
    } catch {
      return null;
    }
  }

  private humanizeMessage(message: string): string {
    try {
      return decodeURIComponent(message.replace(/\+/g, ' '));
    } catch {
      return message;
    }
  }
}
