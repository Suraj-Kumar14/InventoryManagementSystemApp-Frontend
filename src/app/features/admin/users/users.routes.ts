import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, Routes } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { roleGuard } from '../../../core/guards/role.guard';
import {
  AdminUserSummary,
  CreateAdminUserRequest,
  UpdateAdminUserRequest,
  UserProfile,
} from '../../../core/http/backend.models';
import { AuthService } from '../../../core/auth/services/auth.service';
import { AdminUserService } from '../../../core/services/admin-user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { INDIAN_PHONE_REGEX, ROLE_LABELS, UserRole } from '../../../shared/config/app-config';

type UserStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
type UserRoleFilter = UserRole | 'ALL';
type UserModalMode = 'create' | 'edit';
type LoadAction = 'init' | 'search' | 'refresh';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password && !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, ButtonComponent],
  templateUrl: './users-page.component.html',
  styleUrls: ['./users-page.component.css'],
})
class UsersPageComponent implements OnInit {
  readonly roleEnum = UserRole;

  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly adminUserService = inject(AdminUserService);
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly filtersForm = this.fb.nonNullable.group({
    search: [''],
    role: ['ALL' as UserRoleFilter],
    status: ['ALL' as UserStatusFilter],
  });

  readonly userForm = this.fb.group(
    {
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(INDIAN_PHONE_REGEX)]],
      role: [UserRole.STAFF as UserRole, [Validators.required]],
      department: [''],
      password: [''],
      confirmPassword: [''],
      isActive: [true],
    },
    { validators: passwordMatchValidator }
  );

  readonly roleForm = this.fb.nonNullable.group({
    role: [UserRole.STAFF as UserRole, [Validators.required]],
  });

  readonly currentUserId = computed(() => this.authService.getUserId());

  users: UserProfile[] = [];
  summary: AdminUserSummary = this.emptySummary();
  totalUsers = 0;
  loadError = '';

  loading = false;
  searching = false;
  refreshing = false;
  createEditSubmitting = false;
  roleSubmitting = false;
  detailLoading = false;
  actionUserId: number | null = null;

  selectedUser: UserProfile | null = null;
  detailError = '';

  createEditModal: {
    visible: boolean;
    mode: UserModalMode;
    user: UserProfile | null;
  } = { visible: false, mode: 'create', user: null };

  roleModal: {
    visible: boolean;
    user: UserProfile | null;
  } = { visible: false, user: null };

  confirmModal: {
    visible: boolean;
    action: 'activate' | 'deactivate';
    user: UserProfile | null;
    userName: string;
    loading: boolean;
  } = { visible: false, action: 'deactivate', user: null, userName: '', loading: false };

  readonly roleOptions: { value: UserRole; label: string }[] = [
    { value: UserRole.ADMIN, label: this.getRoleLabel(UserRole.ADMIN) },
    { value: UserRole.MANAGER, label: this.getRoleLabel(UserRole.MANAGER) },
    { value: UserRole.OFFICER, label: this.getRoleLabel(UserRole.OFFICER) },
    { value: UserRole.STAFF, label: this.getRoleLabel(UserRole.STAFF) },
  ];

  ngOnInit(): void {
    this.applyDashboardQueryParams();
    this.configureUserForm('create');
    this.loadUsers('init');
  }

  get isCreateMode(): boolean {
    return this.createEditModal.mode === 'create';
  }

  loadUsers(action: LoadAction = 'init'): void {
    this.loading = action === 'init';
    this.searching = action === 'search';
    this.refreshing = action === 'refresh';
    this.loadError = '';

    const filters = this.filtersForm.getRawValue();
    console.log('loadUsers called by:', action);
    console.log('search value:', filters);

    forkJoin({
      page: this.adminUserService.getUsers({
        page: 0,
        size: 50,
        search: filters.search,
        role: filters.role,
        status: filters.status,
      }),
      summary: this.adminUserService.getUserSummary(),
    })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.searching = false;
          this.refreshing = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: ({ page, summary }) => {
          this.users = page.content ?? [];
          this.totalUsers = page.totalElements ?? this.users.length;
          this.summary = summary;
        },
        error: (err) => {
          this.users = [];
          this.totalUsers = 0;
          this.summary = this.emptySummary();
          this.loadError = err?.error?.message || 'Failed to load users. Please try refreshing.';
        },
      });
  }

  onSearch(): void {
    console.log('Search clicked');
    this.syncQueryParams();
    this.loadUsers('search');
  }

  onRefresh(): void {
    this.loadUsers('refresh');
  }

  onClearFilters(): void {
    this.filtersForm.setValue({ search: '', role: 'ALL', status: 'ALL' });
    this.syncQueryParams();
    this.loadUsers('refresh');
  }

  loadData(mode: LoadAction): void {
    this.loadUsers(mode);
  }

  applyFilters(): void {
    this.onSearch();
  }

  clearFilters(): void {
    this.onClearFilters();
  }

  refreshUsers(): void {
    this.onRefresh();
  }

  openCreateModal(): void {
    this.createEditModal = { visible: true, mode: 'create', user: null };
    this.userForm.reset({
      name: '',
      email: '',
      phone: '',
      role: UserRole.STAFF,
      department: '',
      password: '',
      confirmPassword: '',
      isActive: true,
    });
    this.configureUserForm('create');
  }

  openEditModal(user: UserProfile): void {
    this.createEditModal = { visible: true, mode: 'edit', user };
    this.userForm.reset({
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      role: user.role,
      department: user.department ?? '',
      password: '',
      confirmPassword: '',
      isActive: user.isActive !== false,
    });
    this.configureUserForm('edit');
  }

  closeCreateEditModal(): void {
    this.createEditModal = { visible: false, mode: 'create', user: null };
    this.userForm.reset();
  }

  saveUser(): void {
    if (this.createEditSubmitting) {
      return;
    }

    this.userForm.markAllAsTouched();
    if (this.userForm.invalid) {
      this.notifications.warning('Please fix the highlighted user details before saving.', 'Invalid User Details');
      this.cdr.markForCheck();
      return;
    }

    this.createEditSubmitting = true;
    const raw = this.userForm.getRawValue();
    const normalizedName = (raw.name ?? '').trim();
    const normalizedEmail = (raw.email ?? '').trim();
    const normalizedRole = raw.role ?? UserRole.STAFF;
    const normalizedPhone = raw.phone?.trim() || null;
    const normalizedDepartment = raw.department?.trim() || null;
    const editingUserId = this.createEditModal.user?.userId;

    if (!this.isCreateMode && (!editingUserId || Number.isNaN(editingUserId))) {
      this.createEditSubmitting = false;
      this.notifications.error('Unable to identify the selected user for update.', 'Error');
      this.cdr.markForCheck();
      return;
    }

    const request$ = this.isCreateMode
      ? this.adminUserService.createUser({
          name: normalizedName,
          email: normalizedEmail,
          phone: normalizedPhone,
          role: normalizedRole,
          department: normalizedDepartment,
          password: raw.password || '',
          isActive: !!raw.isActive,
        } satisfies CreateAdminUserRequest)
      : this.adminUserService.updateUser(editingUserId!, {
          name: normalizedName,
          email: normalizedEmail,
          phone: normalizedPhone,
          department: normalizedDepartment,
          isActive: !!raw.isActive,
        } satisfies UpdateAdminUserRequest);

    request$
      .pipe(
        finalize(() => {
          this.createEditSubmitting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (savedUser) => {
          this.notifications.success(
            this.isCreateMode ? 'User created successfully.' : 'User updated successfully.',
            this.isCreateMode ? 'User Created' : 'User Updated'
          );
          this.users = this.isCreateMode
            ? [savedUser, ...this.users]
            : this.users.map((user) => (user.userId === savedUser.userId ? savedUser : user));
          this.closeCreateEditModal();
          this.loadUsers('refresh');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Admin user save failed', err);
          this.notifications.error(this.extractErrorMessage(err), 'Error');
        },
      });
  }

  openRoleModal(user: UserProfile): void {
    if (this.isCurrentUser(user)) {
      this.notifications.warning('You cannot change your own admin role.', 'Action blocked');
      return;
    }

    this.roleModal = { visible: true, user };
    this.roleForm.setValue({ role: user.role });
  }

  closeRoleModal(): void {
    this.roleModal = { visible: false, user: null };
    this.roleForm.reset({ role: UserRole.STAFF });
  }

  submitRoleChange(): void {
    const user = this.roleModal.user;
    if (!user || this.roleSubmitting) {
      return;
    }

    this.roleForm.markAllAsTouched();
    if (this.roleForm.invalid) {
      return;
    }

    this.roleSubmitting = true;
    this.adminUserService
      .changeUserRole(user.userId, this.roleForm.getRawValue().role)
      .pipe(
        finalize(() => {
          this.roleSubmitting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.notifications.success('User role updated successfully.', 'Role Updated');
          this.closeRoleModal();
          this.loadUsers('refresh');
        },
        error: (err) => {
          this.notifications.error(err?.error?.message || 'Unable to update user role.', 'Error');
        },
      });
  }

  openUserDetails(user: UserProfile): void {
    this.selectedUser = user;
    this.detailLoading = true;
    this.detailError = '';

    this.adminUserService
      .getUserById(user.userId)
      .pipe(
        finalize(() => {
          this.detailLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (detail) => {
          this.selectedUser = detail;
        },
        error: (err) => {
          this.detailError = err?.error?.message || 'Unable to load user details.';
        },
      });
  }

  closeUserDetails(): void {
    this.selectedUser = null;
    this.detailLoading = false;
    this.detailError = '';
  }

  openConfirmModal(user: UserProfile): void {
    if (this.isCurrentUser(user) && user.isActive !== false) {
      this.notifications.warning('You cannot deactivate your own account.', 'Action blocked');
      return;
    }

    this.confirmModal = {
      visible: true,
      action: user.isActive !== false ? 'deactivate' : 'activate',
      user,
      userName: user.name,
      loading: false,
    };
  }

  closeConfirmModal(): void {
    this.confirmModal = { visible: false, action: 'deactivate', user: null, userName: '', loading: false };
  }

  confirmAction(): void {
    const user = this.confirmModal.user;
    if (!user || this.confirmModal.loading) {
      return;
    }

    this.confirmModal = { ...this.confirmModal, loading: true };
    this.actionUserId = user.userId;

    const request$ =
      this.confirmModal.action === 'deactivate'
        ? this.adminUserService.deactivateUser(user.userId)
        : this.adminUserService.activateUser(user.userId);

    request$
      .pipe(
        finalize(() => {
          this.actionUserId = null;
          this.closeConfirmModal();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (message) => {
          this.notifications.success(
            message || (user.isActive !== false ? 'User deactivated successfully.' : 'User activated successfully.')
          );
          this.loadUsers('refresh');
        },
        error: (err) => {
          this.notifications.error(err?.error?.message || 'Unable to update user status.', 'Error');
        },
      });
  }

  getRoleLabel(role: UserRole): string {
    return ROLE_LABELS[role] ?? role;
  }

  getRoleCount(role: UserRole): number {
    return role === UserRole.ADMIN
      ? this.summary.adminCount
      : role === UserRole.MANAGER
        ? this.summary.inventoryManagerCount
        : role === UserRole.OFFICER
          ? this.summary.purchaseOfficerCount
          : this.summary.warehouseStaffCount;
  }

  isCurrentUser(user: UserProfile): boolean {
    return user.userId === this.currentUserId();
  }

  trackByUserId(_: number, user: UserProfile): number {
    return user.userId;
  }

  private configureUserForm(mode: UserModalMode): void {
    const passwordControl = this.userForm.get('password');
    const confirmPasswordControl = this.userForm.get('confirmPassword');
    const emailControl = this.userForm.get('email');
    const roleControl = this.userForm.get('role');

    if (mode === 'create') {
      passwordControl?.setValidators([
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/),
      ]);
      confirmPasswordControl?.setValidators([Validators.required]);
      emailControl?.enable({ emitEvent: false });
      roleControl?.enable({ emitEvent: false });
    } else {
      passwordControl?.clearValidators();
      confirmPasswordControl?.clearValidators();
      emailControl?.enable({ emitEvent: false });
      roleControl?.disable({ emitEvent: false });
    }

    passwordControl?.updateValueAndValidity({ emitEvent: false });
    confirmPasswordControl?.updateValueAndValidity({ emitEvent: false });
    emailControl?.updateValueAndValidity({ emitEvent: false });
    roleControl?.updateValueAndValidity({ emitEvent: false });
    this.userForm.updateValueAndValidity({ emitEvent: false });
  }

  private emptySummary(): AdminUserSummary {
    return {
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      adminCount: 0,
      inventoryManagerCount: 0,
      purchaseOfficerCount: 0,
      warehouseStaffCount: 0,
      recentLoginCount: 0,
    };
  }

  private extractErrorMessage(error: unknown): string {
    const httpError = error as {
      error?: { message?: string; error?: string } | Record<string, string> | string;
      message?: string;
    };

    if (typeof httpError?.error === 'string') {
      return httpError.error;
    }

    if (typeof httpError?.error === 'object' && httpError.error) {
      return httpError.error.message
        ?? httpError.error.error
        ?? Object.values(httpError.error).find((value): value is string => typeof value === 'string')
        ?? 'Something went wrong';
    }

    return httpError?.message || 'Something went wrong';
  }

  private applyDashboardQueryParams(): void {
    const queryParams = this.route.snapshot.queryParamMap;
    const status = queryParams.get('status');
    const role = queryParams.get('role');
    const search = queryParams.get('search');

    this.filtersForm.patchValue({
      search: search ?? '',
      role: (role as UserRoleFilter) ?? 'ALL',
      status: (status as UserStatusFilter) ?? 'ALL',
    });
  }

  private syncQueryParams(): void {
    const raw = this.filtersForm.getRawValue();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: raw.search || null,
        role: raw.role !== 'ALL' ? raw.role : null,
        status: raw.status !== 'ALL' ? raw.status : null,
      },
      queryParamsHandling: '',
      replaceUrl: true,
    });
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
