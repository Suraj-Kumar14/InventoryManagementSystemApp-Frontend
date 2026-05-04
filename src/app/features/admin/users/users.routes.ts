import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { Routes } from '@angular/router';
import { finalize, retry } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/services/auth.service';
import { UserProfile } from '../../../core/http/backend.models';
import { NotificationService } from '../../../core/services/notification.service';
import { ROLE_LABELS, UserRole } from '../../../shared/config/app-config';
import { roleGuard } from '../../../core/guards/role.guard';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users-page.component.html',
  styleUrls: ['./users-page.component.css'],
})
class UsersPageComponent implements OnInit {
  private authService = inject(AuthService);
  private notifications = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);

  users: UserProfile[] = [];
  loading = false;
  loadError = '';
  actionUserId: number | null = null;
  formSaving = false;
  formError = '';
  formMode: 'create' | 'edit' = 'create';
  editingUserId: number | null = null;
  readonly roleOptions = [UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.PURCHASE_OFFICER, UserRole.WAREHOUSE_STAFF];

  filterForm = this.fb.nonNullable.group({
    keyword: [''],
    role: [''],
    isActive: [''],
  });

  userForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    role: [UserRole.WAREHOUSE_STAFF, Validators.required],
    department: [''],
    password: ['', Validators.required],
    confirmPassword: ['', Validators.required],
    isActive: [true],
  });

  confirmModal: {
    visible: boolean;
    action: 'activate' | 'deactivate';
    user: UserProfile | null;
    userName: string;
  } = { visible: false, action: 'deactivate', user: null, userName: '' };

  get activeCount(): number {
    return this.users.filter((u) => u.isActive).length;
  }

  get inactiveCount(): number {
    return this.users.filter((u) => !u.isActive).length;
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.loadError = '';
    const filters = this.filterForm.getRawValue();
    this.authService
      .searchUsers({
        keyword: filters.keyword,
        role: filters.role as UserRole | '',
        isActive: filters.isActive === '' ? '' : filters.isActive === 'true',
      })
      .pipe(
        retry(1),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (users) => {
          this.users = users;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadError = err?.error?.message || 'Failed to load users. Please try refreshing.';
          this.users = [];
          this.cdr.markForCheck();
        },
      });
  }

  applyFilters(): void {
    this.loadUsers();
  }

  resetFilters(): void {
    this.filterForm.reset({ keyword: '', role: '', isActive: '' });
    this.loadUsers();
  }

  startCreate(): void {
    this.formMode = 'create';
    this.editingUserId = null;
    this.formError = '';
    this.userForm.reset({
      name: '',
      email: '',
      phone: '',
      role: UserRole.WAREHOUSE_STAFF,
      department: '',
      password: '',
      confirmPassword: '',
      isActive: true,
    });
    this.userForm.controls.email.enable();
    this.userForm.controls.password.setValidators([Validators.required]);
    this.userForm.controls.confirmPassword.setValidators([Validators.required]);
    this.userForm.controls.password.updateValueAndValidity();
    this.userForm.controls.confirmPassword.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  startEdit(user: UserProfile): void {
    this.formMode = 'edit';
    this.editingUserId = user.userId;
    this.formError = '';
    this.userForm.reset({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      department: user.department || '',
      password: '',
      confirmPassword: '',
      isActive: user.isActive !== false,
    });
    this.userForm.controls.email.disable();
    this.userForm.controls.password.clearValidators();
    this.userForm.controls.confirmPassword.clearValidators();
    this.userForm.controls.password.updateValueAndValidity();
    this.userForm.controls.confirmPassword.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  submitUserForm(): void {
    if (this.userForm.invalid || this.formSaving) {
      this.userForm.markAllAsTouched();
      return;
    }

    const raw = this.userForm.getRawValue();
    if (this.formMode === 'create' && raw.password !== raw.confirmPassword) {
      this.formError = 'Password and confirm password do not match';
      return;
    }

    this.formError = '';
    this.formSaving = true;
    const request$ = this.formMode === 'create'
      ? this.authService.createUser({
          name: raw.name,
          email: raw.email,
          phone: raw.phone || null,
          role: raw.role,
          department: raw.department || null,
          password: raw.password,
          confirmPassword: raw.confirmPassword,
          isActive: raw.isActive,
        })
      : this.authService.updateUser(this.editingUserId!, {
          name: raw.name,
          phone: raw.phone || null,
          role: raw.role,
          department: raw.department || null,
          isActive: raw.isActive,
        });

    request$
      .pipe(finalize(() => {
        this.formSaving = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.notifications.success(this.formMode === 'create' ? 'User created successfully' : 'User updated successfully');
          this.startCreate();
          this.loadUsers();
        },
        error: (err) => {
          this.formError = err?.error?.message || (this.formMode === 'create' ? 'Unable to create user' : 'Unable to update user');
          this.cdr.markForCheck();
        },
      });
  }

  openConfirmModal(user: UserProfile): void {
    if (!user.userId) {
      return;
    }

    this.confirmModal = {
      visible: true,
      action: user.isActive ? 'deactivate' : 'activate',
      user,
      userName: user.name,
    };
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.confirmModal = { visible: false, action: 'deactivate', user: null, userName: '' };
    this.cdr.markForCheck();
  }

  confirmAction(): void {
    const user = this.confirmModal.user;
    if (!user?.userId) {
      return;
    }

    const isDeactivating = this.confirmModal.action === 'deactivate';
    this.closeModal();
    this.actionUserId = user.userId;

    const idx = this.users.findIndex((candidate) => candidate.userId === user.userId);
    if (idx !== -1) {
      this.users[idx] = { ...this.users[idx], isActive: !isDeactivating };
    }
    this.cdr.markForCheck();

    const request$ = isDeactivating
      ? this.authService.deactivateUser(user.userId)
      : this.authService.activateUser(user.userId);

    request$
      .pipe(
        finalize(() => {
          this.actionUserId = null;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (message) => {
          const notice = message || (isDeactivating ? 'User deactivated successfully.' : 'User activated successfully.');
          if (isDeactivating) {
            this.notifications.warning(notice, 'User Deactivated');
          } else {
            this.notifications.success(notice, 'User Activated');
          }
          this.loadUsers();
        },
        error: (err) => {
          if (idx !== -1) {
            this.users[idx] = { ...this.users[idx], isActive: isDeactivating };
          }
          this.notifications.error(err?.error?.message || 'Action failed. Please try again.', 'Error');
          this.cdr.markForCheck();
        },
      });
  }

  getRoleLabel(role: UserRole): string {
    return ROLE_LABELS[role] ?? role;
  }

  formatDate(value?: string | null): string {
    return value ? new Date(value).toLocaleString() : 'Never';
  }
}

export const usersRoutes: Routes = [
  {
    path: '',
    component: UsersPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN] },
  },
];
