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
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
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
    if (email) this.form.patchValue({ email, otp });
    if (!email || !otp) this.serverError = 'Verify your OTP first.';
  }

  onSubmit(): void {
    if (this.form.invalid || this.isLoading) { this.form.markAllAsTouched(); return; }
    this.isLoading = true;
    this.serverError = '';
    this.authService.resetPassword(this.form.getRawValue() as { email: string; otp: string; newPassword: string }).subscribe({
      next: (response) => {
        this.isLoading = false; this.cdr.detectChanges();
        this.notification.success(response.message || 'Password updated successfully');
        this.router.navigate(['/login']);
      },
      error: (error) => { this.isLoading = false; this.serverError = this.extractMessage(error) || 'Invalid OTP'; this.cdr.detectChanges(); },
    });
  }

  showError(controlName: string): boolean {
    if (controlName === 'email' || controlName === 'otp') return false;
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
