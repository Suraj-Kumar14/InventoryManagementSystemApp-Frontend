import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Injectable, inject } from '@angular/core';
import { Routes } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { UserProfile } from '../../../core/http/backend.models';
import { NotificationService } from '../../../core/services/notification.service';
import { API_ENDPOINTS, ROLE_LABELS, UserRole } from '../../../shared/config/app-config';
import { environment } from '../../../../environments/environment';
import { roleGuard } from '../../../core/guards/role.guard';

@Injectable({ providedIn: 'root' })
class UsersAdminService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getUsers() {
    return this.http.get<UserProfile[]>(`${this.baseUrl}${API_ENDPOINTS.AUTH.USERS}`);
  }

  deactivateUser(id: number) {
    return this.http.delete(`${this.baseUrl}${API_ENDPOINTS.AUTH.DEACTIVATE_USER(id)}`, {
      responseType: 'text',
    });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="space-y-6">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-neutral-900">Users</h1>
          <p class="text-neutral-600 mt-2">Manage registered users from the auth service.</p>
        </div>
        <button
          type="button"
          (click)="loadUsers()"
          [disabled]="loading"
          class="px-4 py-2 rounded-lg bg-primary-600 text-white disabled:opacity-50"
        >
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>

      <div *ngIf="loading" class="rounded-xl border border-neutral-200 bg-white p-6 text-neutral-600">
        Loading users...
      </div>

      <div *ngIf="!loading && users.length === 0" class="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">
        No users returned by the backend.
      </div>

      <div *ngIf="!loading && users.length > 0" class="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table class="min-w-full divide-y divide-neutral-200 text-sm">
          <thead class="bg-neutral-50 text-left text-neutral-600">
            <tr>
              <th class="px-4 py-3">Name</th>
              <th class="px-4 py-3">Email</th>
              <th class="px-4 py-3">Role</th>
              <th class="px-4 py-3">Department</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-200">
            <tr *ngFor="let user of users">
              <td class="px-4 py-3 font-medium text-neutral-900">{{ user.name }}</td>
              <td class="px-4 py-3">{{ user.email }}</td>
              <td class="px-4 py-3">{{ getRoleLabel(user.role) }}</td>
              <td class="px-4 py-3">{{ user.department || 'Not set' }}</td>
              <td class="px-4 py-3">
                <span [class]="user.isActive ? 'text-success-700' : 'text-danger-700'">
                  {{ user.isActive ? 'Active' : 'Deactivated' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <button
                  type="button"
                  (click)="deactivate(user)"
                  [disabled]="!user.isActive || actionUserId === user.userId"
                  class="rounded-md border border-danger-300 px-3 py-1 text-danger-700 disabled:opacity-50"
                >
                  {{ actionUserId === user.userId ? 'Working...' : 'Deactivate' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
})
class UsersPageComponent {
  private usersService = inject(UsersAdminService);
  private notifications = inject(NotificationService);

  users: UserProfile[] = [];
  loading = false;
  actionUserId: number | null = null;

  constructor() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.usersService
      .getUsers()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (users) => (this.users = users),
        error: () => {
          this.users = [];
        },
      });
  }

  deactivate(user: UserProfile): void {
    if (!user.userId || !user.isActive) {
      return;
    }

    this.actionUserId = user.userId;
    this.usersService
      .deactivateUser(user.userId)
      .pipe(finalize(() => (this.actionUserId = null)))
      .subscribe({
        next: (message) => {
          this.notifications.success(message || 'User deactivated successfully.');
          this.loadUsers();
        },
      });
  }

  getRoleLabel(role: UserRole): string {
    return ROLE_LABELS[role] ?? role;
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
