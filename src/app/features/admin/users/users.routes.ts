import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Injectable,
  OnInit,
  inject,
} from '@angular/core';
import { Routes } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, retry } from 'rxjs/operators';
import { UserProfile } from '../../../core/http/backend.models';
import { NotificationService } from '../../../core/services/notification.service';
import {
  API_ENDPOINTS,
  ROLE_LABELS,
  UserRole,
} from '../../../shared/config/app-config';
import { environment } from '../../../../environments/environment';
import { roleGuard } from '../../../core/guards/role.guard';

// ─── Service ────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
class UsersAdminService {
  private http = inject(HttpClient);
  /** All calls go through the API Gateway base URL from environment */
  private baseUrl = environment.apiUrl;

  getUsers(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(
      `${this.baseUrl}${API_ENDPOINTS.AUTH.USERS}`
    );
  }

  activateUser(id: number): Observable<string> {
    return this.http.put(
      `${this.baseUrl}${API_ENDPOINTS.AUTH.ACTIVATE_USER(id)}`,
      {},
      { responseType: 'text' }
    );
  }

  deactivateUser(id: number): Observable<string> {
    return this.http.put(
      `${this.baseUrl}${API_ENDPOINTS.AUTH.DEACTIVATE_USER(id)}`,
      {},
      { responseType: 'text' }
    );
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <!-- Confirmation Modal -->
    <div
      *ngIf="confirmModal.visible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div class="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-neutral-200 p-6 mx-4">
        <div class="flex items-center gap-3 mb-4">
          <div
            [class]="confirmModal.action === 'deactivate'
              ? 'flex h-10 w-10 items-center justify-center rounded-full bg-danger-100'
              : 'flex h-10 w-10 items-center justify-center rounded-full bg-success-100'"
          >
            <svg *ngIf="confirmModal.action === 'deactivate'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 11-12.728 12.728A9 9 0 0118.364 5.636z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 9.172l5.656 5.656M14.828 9.172l-5.656 5.656"/>
            </svg>
            <svg *ngIf="confirmModal.action === 'activate'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-neutral-900">
            {{ confirmModal.action === 'deactivate' ? 'Deactivate User' : 'Activate User' }}
          </h3>
        </div>
        <p class="text-neutral-600 text-sm mb-6">
          Are you sure you want to
          <strong>{{ confirmModal.action }}</strong>
          <span class="font-semibold text-neutral-800"> {{ confirmModal.userName }}</span>?
          {{ confirmModal.action === 'deactivate' ? 'They will not be able to log in.' : 'They will regain access.' }}
        </p>
        <div class="flex gap-3 justify-end">
          <button
            type="button"
            (click)="closeModal()"
            class="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="confirmAction()"
            [class]="confirmModal.action === 'deactivate'
              ? 'px-4 py-2 rounded-lg bg-danger-600 text-white hover:bg-danger-700 transition-colors text-sm font-medium'
              : 'px-4 py-2 rounded-lg bg-success-600 text-white hover:bg-success-700 transition-colors text-sm font-medium'"
          >
            Confirm {{ confirmModal.action === 'deactivate' ? 'Deactivate' : 'Activate' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Page -->
    <section class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-neutral-900">Users</h1>
          <p class="text-neutral-500 mt-1 text-sm">Manage registered users from the auth service.</p>
        </div>
        <button
          type="button"
          id="refresh-users-btn"
          (click)="loadUsers()"
          [disabled]="loading"
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          <svg *ngIf="!loading" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          <svg *ngIf="loading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>

      <!-- Loading skeleton -->
      <div *ngIf="loading" class="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div class="animate-pulse space-y-0">
          <div class="h-12 bg-neutral-100 border-b border-neutral-200"></div>
          <div *ngFor="let i of [1,2,3,4,5]" class="flex gap-4 px-4 py-4 border-b border-neutral-100">
            <div class="h-4 bg-neutral-200 rounded w-1/5"></div>
            <div class="h-4 bg-neutral-200 rounded w-1/4"></div>
            <div class="h-4 bg-neutral-200 rounded w-1/6"></div>
            <div class="h-4 bg-neutral-200 rounded w-1/6"></div>
            <div class="h-4 bg-neutral-200 rounded w-1/8"></div>
            <div class="h-4 bg-neutral-200 rounded w-1/8"></div>
          </div>
        </div>
      </div>

      <!-- Error state -->
      <div
        *ngIf="!loading && loadError"
        class="flex items-center gap-3 rounded-xl border border-danger-200 bg-danger-50 p-5 text-danger-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span class="text-sm">{{ loadError }}</span>
        <button (click)="loadUsers()" class="ml-auto text-sm underline">Retry</button>
      </div>

      <!-- Empty state -->
      <div
        *ngIf="!loading && !loadError && users.length === 0"
        class="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-10 w-10 text-neutral-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        No users returned by the backend.
      </div>

      <!-- Users table -->
      <div
        *ngIf="!loading && !loadError && users.length > 0"
        class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
      >
        <!-- Stats bar -->
        <div class="flex items-center gap-6 px-5 py-3 bg-neutral-50 border-b border-neutral-200 text-xs text-neutral-500 font-medium">
          <span>Total: <span class="text-neutral-900 font-semibold">{{ users.length }}</span></span>
          <span>Active: <span class="text-success-700 font-semibold">{{ activeCount }}</span></span>
          <span>Inactive: <span class="text-danger-700 font-semibold">{{ inactiveCount }}</span></span>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-neutral-100 text-sm">
            <thead class="bg-neutral-50 text-left text-neutral-500 text-xs uppercase tracking-wider">
              <tr>
                <th class="px-5 py-3 font-semibold">#</th>
                <th class="px-5 py-3 font-semibold">Name</th>
                <th class="px-5 py-3 font-semibold">Email</th>
                <th class="px-5 py-3 font-semibold">Role</th>
                <th class="px-5 py-3 font-semibold">Department</th>
                <th class="px-5 py-3 font-semibold">Status</th>
                <th class="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100">
              <tr
                *ngFor="let user of users; let i = index"
                class="hover:bg-neutral-50 transition-colors"
              >
                <td class="px-5 py-3.5 text-neutral-400 font-mono text-xs">{{ i + 1 }}</td>
                <td class="px-5 py-3.5 font-medium text-neutral-900">{{ user.name }}</td>
                <td class="px-5 py-3.5 text-neutral-600">{{ user.email }}</td>
                <td class="px-5 py-3.5">
                  <span class="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-inset ring-primary-200">
                    {{ getRoleLabel(user.role) }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-neutral-500">{{ user.department || '—' }}</td>
                <td class="px-5 py-3.5">
                  <span
                    [class]="user.isActive
                      ? 'inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-semibold text-success-700 ring-1 ring-inset ring-success-200'
                      : 'inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-500 ring-1 ring-inset ring-neutral-200'"
                  >
                    <span
                      [class]="user.isActive ? 'h-1.5 w-1.5 rounded-full bg-success-500' : 'h-1.5 w-1.5 rounded-full bg-neutral-400'"
                    ></span>
                    {{ user.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-right">
                  <button
                    type="button"
                    [id]="'user-action-btn-' + user.userId"
                    (click)="openConfirmModal(user)"
                    [disabled]="actionUserId === user.userId"
                    [class]="user.isActive
                      ? 'inline-flex items-center gap-1 rounded-lg border border-danger-300 bg-white px-3 py-1.5 text-xs font-medium text-danger-700 hover:bg-danger-50 disabled:opacity-50 transition-colors'
                      : 'inline-flex items-center gap-1 rounded-lg border border-success-300 bg-white px-3 py-1.5 text-xs font-medium text-success-700 hover:bg-success-50 disabled:opacity-50 transition-colors'"
                  >
                    <svg *ngIf="actionUserId === user.userId" class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span *ngIf="actionUserId !== user.userId">
                      {{ user.isActive ? 'Deactivate' : 'Activate' }}
                    </span>
                    <span *ngIf="actionUserId === user.userId">Working...</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
})
class UsersPageComponent implements OnInit {
  private usersService = inject(UsersAdminService);
  private notifications = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  users: UserProfile[] = [];
  loading = false;
  loadError = '';
  actionUserId: number | null = null;

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

  /** MODULE 1 FIX: use ngOnInit — no dependency on parent state */
  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.loadError = '';
    this.usersService
      .getUsers()
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
          this.loadError =
            err?.error?.message ||
            'Failed to load users. Please try refreshing.';
          this.users = [];
          this.cdr.markForCheck();
        },
      });
  }

  openConfirmModal(user: UserProfile): void {
    if (!user.userId) return;
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
    if (!user?.userId) return;

    const isDeactivating = this.confirmModal.action === 'deactivate';
    this.closeModal();

    this.actionUserId = user.userId;

    // Optimistic UI update
    const idx = this.users.findIndex((u) => u.userId === user.userId);
    if (idx !== -1) {
      this.users[idx] = { ...this.users[idx], isActive: !isDeactivating };
    }
    this.cdr.markForCheck();

    const request$ = isDeactivating
      ? this.usersService.deactivateUser(user.userId)
      : this.usersService.activateUser(user.userId);

    request$
      .pipe(finalize(() => {
        this.actionUserId = null;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (message) => {
          const msg = message || (isDeactivating ? 'User deactivated successfully.' : 'User activated successfully.');
          isDeactivating
            ? this.notifications.warning(msg, 'User Deactivated')
            : this.notifications.success(msg, 'User Activated');
          // Reload to sync with server
          this.loadUsers();
        },
        error: (err) => {
          // Rollback optimistic update on failure
          if (idx !== -1) {
            this.users[idx] = { ...this.users[idx], isActive: isDeactivating };
          }
          this.notifications.error(
            err?.error?.message || 'Action failed. Please try again.',
            'Error'
          );
          this.cdr.markForCheck();
        },
      });
  }

  getRoleLabel(role: UserRole): string {
    return ROLE_LABELS[role] ?? role;
  }
}

// ─── Routes ─────────────────────────────────────────────────────────────────

export const usersRoutes: Routes = [
  {
    path: '',
    component: UsersPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN] },
  },
];
