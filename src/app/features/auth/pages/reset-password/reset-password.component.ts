import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 px-4">
      <div class="w-full max-w-md bg-white rounded-xl shadow-lg border border-neutral-200 p-8">
        <h2 class="text-2xl font-bold text-neutral-900 mb-2">Reset Password</h2>
        <p class="text-neutral-600 mb-6">Enter the OTP from your email and your new password.</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <input type="email" formControlName="email" placeholder="user@example.com" class="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-100" readonly />
          </div>

          <div>
            <input type="password" formControlName="newPassword" placeholder="New password" class="w-full px-4 py-2 border border-neutral-300 rounded-lg" />
            <p *ngIf="showError('newPassword')" class="mt-1 text-sm text-danger-700">
              Password must contain uppercase, lowercase, number, and special character
            </p>
          </div>

          <p *ngIf="serverError" class="text-sm text-danger-700">{{ serverError }}</p>

          <button type="submit" [disabled]="form.invalid || isLoading" class="w-full py-2 px-4 bg-primary-600 text-white font-medium rounded-lg disabled:opacity-50">
            {{ isLoading ? 'Updating...' : 'Reset Password' }}
          </button>
        </form>

        <p class="text-center text-neutral-600 mt-6">
          <a routerLink="/login" class="text-primary-600 hover:text-primary-700 font-medium">Back to login</a>
        </p>
      </div>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    newPassword: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
  });
  isLoading = false;
  serverError = '';

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email');
    const otp = this.route.snapshot.queryParamMap.get('otp');
    if (email) {
      this.form.patchValue({ email, otp });
    }

    if (!email || !otp) {
      this.serverError = 'Verify your OTP first.';
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.isLoading) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.serverError = '';

    this.authService.resetPassword(this.form.getRawValue() as { email: string; otp: string; newPassword: string }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.notification.success(response.message || 'Password updated successfully');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.isLoading = false;
        this.serverError = this.extractMessage(error) || 'Invalid OTP';
        this.cdr.detectChanges();
      },
    });
  }

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    if (controlName === 'email' || controlName === 'otp') {
      return false;
    }
    return !!control && control.invalid && (control.touched || control.dirty);
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
