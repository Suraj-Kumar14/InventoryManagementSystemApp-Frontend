import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ROLE_PAGES } from '../../../../shared/config/app-config';

@Component({
  selector: 'app-oauth-success',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 px-4">
      <div class="w-full max-w-md bg-white rounded-xl shadow-lg border border-neutral-200 p-8 text-center">
        <h2 class="text-2xl font-bold text-neutral-900 mb-2">Signing you in</h2>
        <p class="text-neutral-600">{{ message }}</p>
      </div>
    </div>
  `,
})
export class OauthSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);

  message = 'Please wait while we finish Google login.';

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const refreshToken = this.route.snapshot.queryParamMap.get('refreshToken');

    if (!token) {
      this.message = 'Google login failed.';
      this.notification.error('Google login failed');
      this.router.navigate(['/login']);
      return;
    }

    this.authService.completeOAuthLogin(token, refreshToken || '').subscribe({
      next: (user) => {
        this.notification.success('Login successful!');
        const rolePage = ROLE_PAGES[user.role] || '/dashboard/admin';
        this.router.navigateByUrl(rolePage);
      },
      error: () => {
        this.message = 'Google login failed.';
        this.notification.error('Google login failed');
        this.router.navigate(['/login']);
      },
    });
  }
}
