import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ROLE_LABELS, UserRole } from '../../../../shared/config/app-config';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  loadingProfile = false;
  profileSaving = false;
  passwordSaving = false;
  passwordError = '';

  profileForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    department: [''],
    roleLabel: [''],
  });

  passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmNewPassword: ['', Validators.required],
  });

  constructor() { this.loadProfile(); }

  loadProfile(): void {
    this.loadingProfile = true;
    this.authService.getProfile().pipe(finalize(() => (this.loadingProfile = false))).subscribe({
      next: (profile) => {
        this.profileForm.patchValue({
          name: profile.name,
          email: profile.email,
          phone: profile.phone || '',
          department: profile.department || '',
          roleLabel: ROLE_LABELS[profile.role as UserRole] || profile.role,
        });
      },
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.profileSaving = true;
    const raw = this.profileForm.getRawValue();
    this.authService.updateProfile({ name: raw.name, phone: raw.phone || null, department: raw.department || null })
      .pipe(finalize(() => (this.profileSaving = false)))
      .subscribe({ next: () => this.notification.success('Profile updated successfully!') });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    const raw = this.passwordForm.getRawValue();
    if (raw.newPassword !== raw.confirmNewPassword) { this.passwordError = 'Passwords do not match'; return; }
    this.passwordError = '';
    this.passwordSaving = true;
    this.authService.changePassword({ oldPassword: raw.currentPassword, newPassword: raw.newPassword })
      .pipe(finalize(() => (this.passwordSaving = false)))
      .subscribe({
        next: () => {
          this.notification.success('Password changed successfully. Please login again.');
          this.authService.logoutLocal();
          this.router.navigate(['/login']);
        },
        error: (error) => {
          const message = String(error?.error?.message || error?.message || '');
          this.passwordError = message.includes('Old password is incorrect') || message.includes('Current password')
            ? 'Current password is incorrect' : message || 'Unable to change password.';
        },
      });
  }
}
