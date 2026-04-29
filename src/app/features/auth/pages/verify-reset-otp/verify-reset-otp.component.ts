import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-verify-reset-otp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 px-4">
      <div class="w-full max-w-md bg-white rounded-xl shadow-lg border border-neutral-200 p-8">
        <h2 class="text-2xl font-bold text-neutral-900 mb-2">Verify Reset OTP</h2>
        <p class="text-neutral-600 mb-6">Enter the OTP sent to your email to continue.</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <input type="email" formControlName="email" placeholder="user@example.com" class="w-full px-4 py-2 border border-neutral-300 rounded-lg" />
            <p *ngIf="showError('email')" class="mt-1 text-sm text-danger-700">Invalid email.</p>
          </div>

          <div>
            <input type="text" formControlName="otp" maxlength="6" placeholder="Enter OTP" class="w-full px-4 py-2 border border-neutral-300 rounded-lg" />
            <p *ngIf="showError('otp')" class="mt-1 text-sm text-danger-700">OTP must be 6 digits.</p>
          </div>

          <p *ngIf="serverError" class="text-sm text-danger-700">{{ serverError }}</p>

          <button type="submit" [disabled]="form.invalid || isLoading" class="w-full py-2 px-4 bg-primary-600 text-white font-medium rounded-lg disabled:opacity-50">
            {{ isLoading ? 'Verifying...' : 'Verify OTP' }}
          </button>
        </form>

        <p class="text-center text-neutral-600 mt-6">
          <a routerLink="/forgot-password" class="text-primary-600 hover:text-primary-700 font-medium">Back to forgot password</a>
        </p>
      </div>
    </div>
  `,
})
export class VerifyResetOtpComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });
  isLoading = false;
  serverError = '';

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) {
      this.form.patchValue({ email });
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.isLoading) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.serverError = '';

    this.authService.verifyOtp(this.form.getRawValue() as { email: string; otp: string }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.notification.success(response.message || 'OTP verified successfully');
        this.router.navigate(['/reset-password'], {
          queryParams: {
            email: this.form.get('email')?.value,
            otp: this.form.get('otp')?.value,
          },
        });
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
