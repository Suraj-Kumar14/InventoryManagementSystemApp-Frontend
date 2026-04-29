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
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 px-4 py-8">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-neutral-900 mb-2">StockPro</h1>
          <p class="text-neutral-600 text-lg">Create your account</p>
        </div>

        <div class="bg-white rounded-xl shadow-lg border border-neutral-200 p-8">
          <h2 class="text-2xl font-bold text-neutral-900 mb-6">Sign Up</h2>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <input type="text" formControlName="name" placeholder="Full name" class="w-full px-4 py-2 border border-neutral-300 rounded-lg" />
              <p *ngIf="showError('name')" class="mt-1 text-sm text-danger-700">Name must be at least 2 characters.</p>
            </div>

            <div>
              <input type="email" formControlName="email" placeholder="user@example.com" class="w-full px-4 py-2 border border-neutral-300 rounded-lg" />
              <p *ngIf="showError('email')" class="mt-1 text-sm text-danger-700">Invalid email.</p>
            </div>

            <div>
              <select formControlName="role" class="w-full px-4 py-2 border border-neutral-300 rounded-lg">
                <option value="">Select your role</option>
                <option *ngFor="let role of allowedRoles" [value]="role">{{ getRoleLabel(role) }}</option>
              </select>
              <p *ngIf="showError('role')" class="mt-1 text-sm text-danger-700">Please select a role.</p>
            </div>

            <div>
              <input type="password" formControlName="password" placeholder="Password" class="w-full px-4 py-2 border border-neutral-300 rounded-lg" />
              <p *ngIf="showError('password')" class="mt-1 text-sm text-danger-700">
                Password must contain uppercase, lowercase, number, and special character
              </p>
            </div>

            <div>
              <input type="tel" formControlName="phone" placeholder="Phone (optional, e.g. 9876543210)" class="w-full px-4 py-2 border border-neutral-300 rounded-lg" />
              <p *ngIf="showError('phone')" class="mt-1 text-sm text-danger-700">Enter a valid 10-digit Indian mobile number (starts with 6–9).</p>
            </div>
            <input type="text" formControlName="department" placeholder="Department (optional)" class="w-full px-4 py-2 border border-neutral-300 rounded-lg" />

            <p *ngIf="serverError" class="text-sm text-danger-700">{{ serverError }}</p>

            <button type="submit" [disabled]="registerForm.invalid || isLoading" class="w-full py-2 px-4 bg-primary-600 text-white font-medium rounded-lg disabled:opacity-50">
              {{ isLoading ? 'Sending OTP...' : 'Continue' }}
            </button>
          </form>

          <p class="text-center text-neutral-600 mt-6">
            Already have an account?
            <a routerLink="/login" class="text-primary-600 hover:text-primary-700 font-medium">Sign In</a>
          </p>
        </div>
      </div>
    </div>
  `,
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
    if (message.toLowerCase().includes('email already exists')) {
      return 'Email already exists';
    }
    return message || 'Unable to continue signup right now.';
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
