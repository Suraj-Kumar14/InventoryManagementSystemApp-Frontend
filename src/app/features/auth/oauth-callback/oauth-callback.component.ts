import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TokenService } from '../../../core/services/token.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

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
  tokenSvc = inject(TokenService);
  auth     = inject(AuthService);
  toast    = inject(ToastService);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const error = this.route.snapshot.queryParamMap.get('error');

    if (error) {
      this.toast.error('Google Login Failed', error);
      this.router.navigate(['/auth/login']);
      return;
    }

    if (token) {
      // In a real scenario, we might also get refreshToken and user object.
      // If backend just sends token, we set it and maybe call a /me endpoint to get the user.
      this.tokenSvc.setToken(token);
      this.toast.success('Login successful!');
      this.auth.redirectAfterLogin();
    } else {
      this.toast.error('Login Failed', 'No token received from Google');
      this.router.navigate(['/auth/login']);
    }
  }
}
