import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div class="auth-form-card">
      <div class="auth-form-header">
        <div class="back-icon">🔒</div>
        <h2>Set new password</h2>
        <p>Your new password must be at least 8 characters.</p>
      </div>
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="form-group">
          <label class="form-label">New Password</label>
          <div class="password-field">
            <input [type]="showPw() ? 'text' : 'password'" class="form-control"
                   [class.is-invalid]="pw.invalid && pw.touched"
                   formControlName="password" placeholder="Min 8 chars, 1 uppercase, 1 number" />
            <button type="button" class="password-toggle" (click)="togglePw()">{{ showPw() ? '🙈':'👁️' }}</button>
          </div>
          @if (pw.invalid && pw.touched) {
            <div class="form-error">Min 8 chars with at least 1 uppercase letter and 1 number</div>
          }
        </div>
        <div class="form-group">
          <label class="form-label">Confirm Password</label>
          <input [type]="showPw() ? 'text' : 'password'" class="form-control"
                 [class.is-invalid]="confirm.invalid && confirm.touched"
                 formControlName="confirm" placeholder="Repeat your password" />
          @if (confirm.value && confirm.value !== pw.value) {
            <div class="form-error">Passwords do not match</div>
          }
        </div>
        <button type="submit" class="btn btn-primary w-full" [disabled]="loading()">
          @if (loading()) { <span class="spinner"></span> Resetting... }
          @else { Reset Password }
        </button>
        <a routerLink="/auth/login" style="display:block;text-align:center;margin-top:1rem;font-size:.875rem;color:var(--text-muted)">Back to Login</a>
      </form>
    </div>
  `,
  styles: [`
    .auth-form-card{width:100%;max-width:420px;background:var(--surface-card);border-radius:var(--radius-xl);padding:2.5rem 2rem;box-shadow:var(--shadow-xl);border:1px solid var(--border-color)}
    .auth-form-header{text-align:center;margin-bottom:1.75rem}
    .back-icon{font-size:2.5rem;margin-bottom:.75rem}
    .auth-form-header h2{font-size:1.5rem;font-weight:800;margin-bottom:.375rem}
    .auth-form-header p{font-size:.875rem;color:var(--text-muted)}
    .password-field{position:relative}
    .password-toggle{position:absolute;right:.625rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1rem}
  `]
})
export class ResetPasswordComponent {
  fb     = inject(FormBuilder);
  auth   = inject(AuthService);
  router = inject(Router);
  route  = inject(ActivatedRoute);
  toast  = inject(ToastService);
  loading = signal(false);
  showPw  = signal(false);

  form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)]],
    confirm:  ['', Validators.required]
  });

  get pw()      { return this.form.get('password')!; }
  get confirm() { return this.form.get('confirm')!; }

  togglePw(): void { this.showPw.update(v => !v); }

  submit(): void {
    if (this.form.invalid || this.pw.value !== this.confirm.value) {
      this.form.markAllAsTouched(); return;
    }
    this.loading.set(true);
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.auth.resetPassword(token, this.pw.value!).subscribe({
      next: () => { this.toast.success('Password reset!', 'You can now log in.'); this.router.navigate(['/auth/login']); },
      error: err => { this.loading.set(false); this.toast.error('Reset failed', err.error?.message); }
    });
  }
}
