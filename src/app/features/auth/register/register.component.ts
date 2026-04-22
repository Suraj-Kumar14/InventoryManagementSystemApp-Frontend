import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  fb     = inject(FormBuilder);
  auth   = inject(AuthService);
  router = inject(Router);
  toast  = inject(ToastService);

  loading      = signal(false);
  showPassword = signal(false);

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName:  ['', [Validators.required, Validators.minLength(2)]],
    email:     ['', [Validators.required, Validators.email]],
    password:  ['', [Validators.required, Validators.minLength(8),
                     Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)]]
  });

  get firstName() { return this.form.get('firstName')!; }
  get lastName()  { return this.form.get('lastName')!; }
  get email()     { return this.form.get('email')!; }
  get password()  { return this.form.get('password')!; }

  togglePassword(): void { this.showPassword.update(v => !v); }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const val = {
      firstName: this.firstName.value!,
      lastName:  this.lastName.value!,
      email:     this.email.value!,
      password:  this.password.value!
    };
    this.auth.register(val).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Registration successful!', 'Please check your email for the verification code.');
        this.router.navigate(['/auth/verify-email-otp'], { queryParams: { email: val.email } });
      },
      error: err => {
        this.loading.set(false);
        this.toast.error('Registration failed', err.error?.message ?? 'Please try again.');
      }
    });
  }
}
