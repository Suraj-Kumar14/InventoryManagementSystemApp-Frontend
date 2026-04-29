import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ROLE_PAGES } from '../../../../shared/config/app-config';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notification = inject(NotificationService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  loginForm!: FormGroup;
  isLoading = false;
  serverError = '';

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    this.route.queryParamMap.subscribe((params) => {
      const oauthError = params.get('oauthError');
      if (oauthError) {
        this.serverError = oauthError;
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.serverError = '';
    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.notification.success('Login successful!');
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const rolePage = ROLE_PAGES[response.user.role] || '/dashboard/admin';
        this.router.navigateByUrl(returnUrl || rolePage);
      },
      error: (error) => {
        this.isLoading = false;
        this.serverError = this.mapLoginError(error);
        this.cdr.detectChanges();
      },
    });
  }

  loginWithGoogle(): void {
    if (this.isLoading) return;
    this.isLoading = true;
    this.authService.startGoogleLogin();
  }

  showError(controlName: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  private mapLoginError(error: unknown): string {
    const message = this.extractMessage(error).toLowerCase();
    if (message.includes('invalid credentials') || message.includes('user not found')) {
      return 'Invalid credentials';
    }
    return this.extractMessage(error) || 'Login failed. Please try again.';
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
