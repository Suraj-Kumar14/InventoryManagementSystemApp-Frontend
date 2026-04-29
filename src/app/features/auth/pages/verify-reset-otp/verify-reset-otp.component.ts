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
  templateUrl: './verify-reset-otp.component.html',
  styleUrls: ['./verify-reset-otp.component.css'],
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
    if (email) this.form.patchValue({ email });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isLoading) { this.form.markAllAsTouched(); return; }
    this.isLoading = true;
    this.serverError = '';
    this.authService.verifyOtp(this.form.getRawValue() as { email: string; otp: string }).subscribe({
      next: (response) => {
        this.isLoading = false; this.cdr.detectChanges();
        this.notification.success(response.message || 'OTP verified successfully');
        this.router.navigate(['/reset-password'], {
          queryParams: { email: this.form.get('email')?.value, otp: this.form.get('otp')?.value },
        });
      },
      error: (error) => { this.isLoading = false; this.serverError = this.extractMessage(error) || 'Invalid OTP'; this.cdr.detectChanges(); },
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
