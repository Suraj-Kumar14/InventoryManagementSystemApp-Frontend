import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div class="auth-form-card">
      <div class="auth-form-header">
        <div class="back-icon">🔑</div>
        <h2>Forgot password?</h2>
        <p>Enter your email and we'll send you reset instructions.</p>
      </div>
      @if (sent()) {
        <div class="success-box">
          <div class="success-icon">✅</div>
          <h3>Check your inbox</h3>
          <p>We sent a password reset link to <strong>{{ form.get('email')?.value }}</strong></p>
          <a routerLink="/auth/login" class="btn btn-outline w-full" style="margin-top:1rem">Back to Login</a>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="form-group">
            <label class="form-label">Email address</label>
            <input type="email" class="form-control"
                   [class.is-invalid]="email.invalid && email.touched"
                   formControlName="email" placeholder="you@company.com" />
            @if (email.invalid && email.touched) {
              <div class="form-error">Enter a valid email address</div>
            }
          </div>
          <button type="submit" class="btn btn-primary w-full" [disabled]="loading()">
            @if (loading()) { <span class="spinner"></span> Sending... }
            @else { Send Reset Link }
          </button>
          <a routerLink="/auth/login" class="back-link">← Back to Sign In</a>
        </form>
      }
    </div>
  `,
  styles: [`
    .auth-form-card {
      width:100%;max-width:420px;background:var(--surface-card);
      border-radius:var(--radius-xl);padding:2.5rem 2rem;
      box-shadow:var(--shadow-xl);border:1px solid var(--border-color);
    }
    .auth-form-header{text-align:center;margin-bottom:1.75rem}
    .back-icon{font-size:2.5rem;margin-bottom:.75rem}
    .auth-form-header h2{font-size:1.5rem;font-weight:800;margin-bottom:.375rem}
    .auth-form-header p{font-size:.875rem;color:var(--text-muted)}
    .success-box{text-align:center;padding:.5rem 0}
    .success-icon{font-size:3rem;margin-bottom:1rem}
    .success-box h3{font-size:1.125rem;font-weight:700;margin-bottom:.5rem}
    .success-box p{font-size:.875rem;color:var(--text-muted)}
    .back-link{display:block;text-align:center;margin-top:1.25rem;font-size:.875rem;color:var(--text-muted);text-decoration:none}
    .back-link:hover{color:var(--color-primary)}
  `]
})
export class ForgotPasswordComponent {
  fb    = inject(FormBuilder);
  auth  = inject(AuthService);
  toast = inject(ToastService);
  router = inject(Router);
  loading = signal(false);
  sent    = signal(false);
  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  get email() { return this.form.get('email')!; }
  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.auth.forgotPassword(this.email.value!).subscribe({
      next: () => { 
        this.loading.set(false); 
        this.router.navigate(['/auth/verify-forgot-password-otp'], { queryParams: { email: this.email.value } });
      },
      error: err => { this.loading.set(false); this.toast.error('Failed', err.error?.message); }
    });
  }
}
