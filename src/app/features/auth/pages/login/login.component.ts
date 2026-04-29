import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ROLE_PAGES } from '../../../../shared/config/app-config';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 px-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-neutral-900 mb-2">StockPro</h1>
          <p class="text-neutral-600 text-lg">Inventory Management System</p>
        </div>

        <div class="bg-white rounded-xl shadow-lg border border-neutral-200 p-8">
          <h2 class="text-2xl font-bold text-neutral-900 mb-6">Sign In</h2>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-neutral-700 mb-2">Email Address</label>
              <input id="email" type="email" formControlName="email" placeholder="user@example.com" class="w-full px-4 py-2 border border-neutral-300 rounded-lg" />
              <p *ngIf="showError('email')" class="mt-1 text-sm text-danger-700">Invalid email.</p>
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-neutral-700 mb-2">Password</label>
              <input id="password" type="password" formControlName="password" class="w-full px-4 py-2 border border-neutral-300 rounded-lg" />
              <p *ngIf="showError('password')" class="mt-1 text-sm text-danger-700">Password is required.</p>
            </div>

            <p *ngIf="serverError" class="text-sm text-danger-700">{{ serverError }}</p>

            <button type="submit" [disabled]="loginForm.invalid || isLoading" class="w-full py-2 px-4 bg-primary-600 text-white font-medium rounded-lg disabled:opacity-50">
              {{ isLoading ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>

          <button type="button" (click)="loginWithGoogle()" [disabled]="isLoading" class="mt-4 w-full py-2 px-4 border border-neutral-300 text-neutral-900 font-medium rounded-lg disabled:opacity-50 flex items-center justify-center gap-3">
            <svg *ngIf="!isLoading" aria-hidden="true" viewBox="0 0 24 24" class="h-5 w-5">
              <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.6 3.6 14.5 2.8 12 2.8 6.9 2.8 2.8 7 2.8 12s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1.1-.2-1.6H12Z"/>
              <path fill="#34A853" d="M2.8 12c0 5 4.1 9.2 9.2 9.2 5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1.1-.2-1.6H12v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6Z"/>
              <path fill="#4A90E2" d="M2.8 6.7l3.2 2.3C6.9 7.2 9.2 5.9 12 5.9c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.6 3.6 14.5 2.8 12 2.8c-3.5 0-6.6 2-8.1 4.9Z"/>
              <path fill="#FBBC05" d="M2.8 12c0 1.5.4 2.9 1.2 4.1L7.5 13c-.2-.3-.3-.7-.3-1s.1-.7.3-1L4 7.9C3.2 9.1 2.8 10.5 2.8 12Z"/>
            </svg>
            {{ isLoading ? 'Please wait...' : 'Login with Google' }}
          </button>

          <p class="text-center text-neutral-600 mt-4">
            <a routerLink="/forgot-password" class="text-primary-600 hover:text-primary-700 font-medium">Forgot password?</a>
          </p>

          <p class="text-center text-neutral-600 mt-4">
            Don't have an account?
            <a routerLink="/register" class="text-primary-600 hover:text-primary-700 font-medium">Sign Up</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notification = inject(NotificationService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  loginForm!: FormGroup;
  isLoading = false;
  serverError = '';

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    this.route.queryParamMap.subscribe((params) => {
      const oauthError = params.get('oauthError');

      if (oauthError) {
        this.serverError = oauthError;
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.serverError = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.notification.success('Login successful!');
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const rolePage = ROLE_PAGES[response.user.role] || '/dashboard/admin';
        this.router.navigateByUrl(returnUrl || rolePage);
      },
      error: (error) => {
        this.isLoading = false;
        this.serverError = this.mapLoginError(error);
        this.cdr.detectChanges();
      },
    });
  }

  loginWithGoogle(): void {
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;
    this.authService.startGoogleLogin();
  }

  showError(controlName: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  private mapLoginError(error: unknown): string {
    const message = this.extractMessage(error).toLowerCase();
    if (message.includes('invalid credentials') || message.includes('user not found')) {
      return 'Invalid credentials';
    }
    return this.extractMessage(error) || 'Login failed. Please try again.';
  }

  private extractMessage(error: unknown): string {
    const httpError = error as { error?: { message?: string } | Record<string, string>; message?: string };
    if (typeof httpError?.error === 'object' && httpError.error && 'message' in httpError.error) {
      return String(httpError.error.message || '');
    }

    if (typeof httpError?.error === 'object' && httpError.error) {
      const first = Object.values(httpError.error)[0];
      if (typeof first === 'string') {
        return first;
      }
    }

    return httpError?.message || '';
  }
}
