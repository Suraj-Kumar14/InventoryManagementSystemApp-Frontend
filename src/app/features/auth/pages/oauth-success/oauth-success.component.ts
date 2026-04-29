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
  templateUrl: './oauth-success.component.html',
  styleUrls: ['./oauth-success.component.css'],
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
