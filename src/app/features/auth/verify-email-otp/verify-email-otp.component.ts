import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-verify-email-otp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-card animate-fade-in">
      <div class="auth-header">
        <h2 class="auth-title">Verify Your Email</h2>
        <p class="auth-subtitle">We sent a 6-digit code to <strong>{{ email() }}</strong></p>
      </div>

      <form [formGroup]="form" (ngSubmit)="verify()" novalidate>
        <div class="form-group">
          <label class="form-label" for="otp">Security Code</label>
          <input type="text" id="otp" class="form-control text-center" style="font-size:1.5rem; letter-spacing:0.5rem"
                 formControlName="otp" maxlength="6"
                 [class.is-invalid]="f['otp'].invalid && f['otp'].touched"
                 placeholder="000000" autocomplete="one-time-code" />
          @if (f['otp'].invalid && f['otp'].touched) {
            <div class="form-error">Please enter a valid 6-digit code</div>
          }
        </div>

        <button type="submit" class="btn btn-primary w-full" [disabled]="form.invalid || loading()">
          @if (loading()) {
            <span class="spinner"></span> Verifying...
          } @else {
            Verify & Continue
          }
        </button>
      </form>

      <div class="auth-footer text-center" style="margin-top:1.5rem">
        <p class="text-sm text-muted">Didn't receive the code?</p>
        <button type="button" class="btn btn-ghost btn-sm" (click)="resend()" [disabled]="countdown() > 0 || resending()">
          @if (resending()) {
            <span class="spinner spinner-dark" style="width:14px;height:14px"></span> Sending...
          } @else if (countdown() > 0) {
            Resend Code in {{ countdown() }}s
          } @else {
            Resend Code
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .auth-card { width: 100%; max-width: 400px; }
    .auth-header { margin-bottom: 2rem; text-align: center; }
    .auth-title { font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; }
    .auth-subtitle { font-size: 0.9375rem; color: var(--text-secondary); }
    .auth-footer { border-top: 1px solid var(--border-color); padding-top: 1.5rem; }
  `]
})
export class VerifyEmailOtpComponent implements OnInit, OnDestroy {
  fb       = inject(FormBuilder);
  auth     = inject(AuthService);
  router   = inject(Router);
  route    = inject(ActivatedRoute);
  toast    = inject(ToastService);

  email    = signal('');
  loading  = signal(false);
  resending= signal(false);
  countdown= signal(60);

  timerInterval: any;

  form = this.fb.group({
    otp: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
  });

  get f() { return this.form.controls; }

  ngOnInit(): void {
    const emailParam = this.route.snapshot.queryParamMap.get('email');
    if (!emailParam) {
      this.toast.error('Missing email parameter');
      this.router.navigate(['/auth/login']);
      return;
    }
    this.email.set(emailParam);
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  startCountdown(): void {
    this.countdown.set(60);
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      const current = this.countdown();
      if (current > 0) {
        this.countdown.set(current - 1);
      } else {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  verify(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    this.loading.set(true);
    const otp = this.form.value.otp!;
    
    this.auth.verifyEmailOtp(this.email(), otp).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Email verified successfully!');
        if (this.auth.isLoggedIn()) {
          this.auth.ensureCurrentUserLoaded().subscribe({
            next: () => this.auth.redirectAfterLogin(true)
          });
          return;
        }

        this.router.navigate(['/auth/login'], {
          queryParams: { email: this.email(), verified: '1' }
        });
      },
      error: err => {
        this.loading.set(false);
        this.toast.error('Verification failed', err.error?.message || 'Invalid or expired OTP');
      }
    });
  }

  resend(): void {
    if (this.countdown() > 0) return;
    
    this.toast.info(
      'Resend not available',
      'Your current backend controller does not expose a resend registration OTP endpoint yet.'
    );
  }
}
