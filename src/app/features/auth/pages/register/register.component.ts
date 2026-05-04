import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { INDIAN_PHONE_REGEX, ROLE_LABELS, ROLE_REGISTRATION_ALLOWED, UserRole } from '../../../../shared/config/app-config';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  registerForm!: FormGroup;
  isLoading = false;
  serverError = '';
  allowedRoles = ROLE_REGISTRATION_ALLOWED;

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      phone: ['', [Validators.pattern(INDIAN_PHONE_REGEX)]],
      department: [''],
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid || this.isLoading) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.serverError = '';
    this.isLoading = true;
    this.authService.register(this.registerForm.getRawValue()).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.notification.success(response.message || 'OTP sent to your email.');
        this.router.navigate(['/verify-otp'], {
          queryParams: { email: this.registerForm.get('email')?.value },
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.serverError = this.mapError(error);
        this.cdr.detectChanges();
      },
    });
  }

  showError(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  getRoleLabel(role: UserRole): string {
    return ROLE_LABELS[role] || role;
  }

  private mapError(error: unknown): string {
    const message = this.extractMessage(error);
    if (message.toLowerCase().includes('email already exists')) return 'Email already exists';
    return message || 'Unable to continue signup right now.';
  }

  private extractMessage(error: unknown): string {
    const httpError = error as { error?: { message?: string } | Record<string, string>; message?: string };
    if (typeof httpError?.error === 'object' && httpError.error && 'message' in httpError.error) {
      return String(httpError.error.message || '');
    }
    if (typeof httpError?.error === 'object' && httpError.error) {
      const first = Object.values(httpError.error)[0];
      if (typeof first === 'string') return first;
    }
    return httpError?.message || '';
  }
}
