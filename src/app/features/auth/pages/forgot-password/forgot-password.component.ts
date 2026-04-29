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
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  isLoading = false;
  serverError = '';

  onSubmit(): void {
    if (this.form.invalid || this.isLoading) { this.form.markAllAsTouched(); return; }
    this.isLoading = true;
    this.serverError = '';
    this.authService.forgotPassword(this.form.getRawValue() as { email: string }).subscribe({
      next: (response) => {
        this.isLoading = false; this.cdr.detectChanges();
        this.notification.success(response.message);
        this.router.navigate(['/verify-reset-otp'], { queryParams: { email: this.form.get('email')?.value } });
      },
      error: (error) => { this.isLoading = false; this.serverError = this.extractMessage(error) || 'Unable to send OTP.'; this.cdr.detectChanges(); },
    });
  }

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  private extractMessage(error: unknown): string {
    const e = error as { error?: { message?: string } | Record<string, string>; message?: string };
    if (typeof e?.error === 'object' && e.error && 'message' in e.error) return String(e.error.message || '');
    if (typeof e?.error === 'object' && e.error) { const first = Object.values(e.error)[0]; if (typeof first === 'string') return first; }
    return e?.message || '';
  }
}
