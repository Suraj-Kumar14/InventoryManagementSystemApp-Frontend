import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  fb      = inject(FormBuilder);
  auth    = inject(AuthService);
  router  = inject(Router);
  toast   = inject(ToastService);

  loading      = signal(false);
  showPassword = signal(false);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  get email()    { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }

  togglePassword(): void { this.showPassword.update(v => !v); }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);

    this.auth.login({ email: this.email.value!, password: this.password.value! }).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Welcome back!');
        this.auth.redirectAfterLogin();
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message ?? 'Invalid credentials. Please try again.';
        if (msg.toLowerCase().includes('not verified')) {
          this.toast.warning('Account not verified', 'Redirecting to verification page...');
          this.router.navigate(['/auth/verify-email-otp'], { queryParams: { email: this.email.value } });
        } else {
          this.toast.error('Login failed', msg);
        }
      }
    });
  }

  loginWithGoogle(): void {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  }
}
