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
  template: `
    <div class="max-w-3xl space-y-6">
      <div>
        <h1 class="text-3xl font-bold text-neutral-900">Settings</h1>
        <p class="text-neutral-600 mt-2">Manage your profile and password using auth-service APIs.</p>
      </div>

      <div class="bg-white rounded-lg shadow border border-neutral-200 p-6">
        <h2 class="text-xl font-bold text-neutral-900 mb-6">Profile Settings</h2>

        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium text-neutral-700 mb-2">Full Name</label>
            <input id="name" type="text" formControlName="name" class="w-full px-4 py-2 border border-neutral-300 rounded-lg" />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-neutral-700 mb-2">Email Address</label>
            <input id="email" type="email" formControlName="email" [disabled]="true" class="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-500" />
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label for="phone" class="block text-sm font-medium text-neutral-700 mb-2">Phone</label>
              <input id="phone" type="text" formControlName="phone" class="w-full px-4 py-2 border border-neutral-300 rounded-lg" />
            </div>
            <div>
              <label for="department" class="block text-sm font-medium text-neutral-700 mb-2">Department</label>
              <input id="department" type="text" formControlName="department" class="w-full px-4 py-2 border border-neutral-300 rounded-lg" />
            </div>
          </div>

          <div>
            <label for="role" class="block text-sm font-medium text-neutral-700 mb-2">Role</label>
            <input id="role" type="text" formControlName="roleLabel" [disabled]="true" class="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-500" />
          </div>

          <button type="submit" [disabled]="profileForm.invalid || profileSaving || loadingProfile" class="w-full py-2 px-4 bg-primary-600 text-white font-medium rounded-lg disabled:opacity-50">
            {{ profileSaving ? 'Saving...' : 'Save Changes' }}
          </button>
        </form>
      </div>

      <div class="bg-white rounded-lg shadow border border-neutral-200 p-6">
        <h2 class="text-xl font-bold text-neutral-900 mb-6">Change Password</h2>

        <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="space-y-4">
          <div>
            <label for="currentPassword" class="block text-sm font-medium text-neutral-700 mb-2">Current Password</label>
            <input id="currentPassword" type="password" formControlName="currentPassword" class="w-full px-4 py-2 border border-neutral-300 rounded-lg" />
          </div>

          <div>
            <label for="newPassword" class="block text-sm font-medium text-neutral-700 mb-2">New Password</label>
            <input id="newPassword" type="password" formControlName="newPassword" class="w-full px-4 py-2 border border-neutral-300 rounded-lg" />
          </div>

          <div>
            <label for="confirmNewPassword" class="block text-sm font-medium text-neutral-700 mb-2">Confirm New Password</label>
            <input id="confirmNewPassword" type="password" formControlName="confirmNewPassword" class="w-full px-4 py-2 border border-neutral-300 rounded-lg" />
          </div>

          <p *ngIf="passwordError" class="text-sm text-danger-700">{{ passwordError }}</p>

          <button type="submit" [disabled]="passwordForm.invalid || passwordSaving" class="w-full py-2 px-4 bg-primary-600 text-white font-medium rounded-lg disabled:opacity-50">
            {{ passwordSaving ? 'Updating...' : 'Update Password' }}
          </button>
        </form>
      </div>
    </div>
  `,
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

  constructor() {
    this.loadProfile();
  }

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
    if (this.profileForm.invalid) {
      return;
    }

    this.profileSaving = true;
    const raw = this.profileForm.getRawValue();
    this.authService
      .updateProfile({
        name: raw.name,
        phone: raw.phone || null,
        department: raw.department || null,
      })
      .pipe(finalize(() => (this.profileSaving = false)))
      .subscribe({
        next: () => this.notification.success('Profile updated successfully!'),
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }

    const raw = this.passwordForm.getRawValue();
    if (raw.newPassword !== raw.confirmNewPassword) {
      this.passwordError = 'Passwords do not match';
      return;
    }

    this.passwordError = '';
    this.passwordSaving = true;
    this.authService
      .changePassword({
        oldPassword: raw.currentPassword,
        newPassword: raw.newPassword,
      })
      .pipe(finalize(() => (this.passwordSaving = false)))
      .subscribe({
        next: () => {
          this.notification.success('Password changed successfully. Please login again.');
          this.authService.logoutLocal();
          this.router.navigate(['/login']);
        },
        error: (error) => {
          const message = String(error?.error?.message || error?.message || '');
          this.passwordError =
            message.includes('Old password is incorrect') || message.includes('Current password')
              ? 'Current password is incorrect'
              : message || 'Unable to change password.';
        },
      });
  }
}
