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
  templateUrl: './users-page.component.html',
  styleUrls: ['./users-page.component.css'],
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
