import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 px-4">
      <div class="w-full max-w-md bg-white rounded-xl shadow-lg border border-neutral-200 p-8">
        <h2 class="text-2xl font-bold text-neutral-900 mb-2">Forgot Password</h2>
        <p class="text-neutral-600 mb-6">Enter your email to receive a reset OTP.</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <input type="email" formControlName="email" placeholder="user@example.com" class="w-full px-4 py-2 border border-neutral-300 rounded-lg" />
            <p *ngIf="showError('email')" class="mt-1 text-sm text-danger-700">Invalid email.</p>
          </div>

          <p *ngIf="serverError" class="text-sm text-danger-700">{{ serverError }}</p>

          <button type="submit" [disabled]="form.invalid || isLoading" class="w-full py-2 px-4 bg-primary-600 text-white font-medium rounded-lg disabled:opacity-50">
            {{ isLoading ? 'Sending OTP...' : 'Send OTP' }}
          </button>
        </form>

        <p class="text-center text-neutral-600 mt-6">
          <a routerLink="/login" class="text-primary-600 hover:text-primary-700 font-medium">Back to login</a>
        </p>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });
  isLoading = false;
  serverError = '';

  onSubmit(): void {
    if (this.form.invalid || this.isLoading) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.serverError = '';

    this.authService.forgotPassword(this.form.getRawValue() as { email: string }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.notification.success(response.message);
        this.router.navigate(['/verify-reset-otp'], {
          queryParams: { email: this.form.get('email')?.value },
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.serverError = this.extractMessage(error) || 'Unable to send OTP.';
        this.cdr.detectChanges();
      },
    });
  }

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
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
