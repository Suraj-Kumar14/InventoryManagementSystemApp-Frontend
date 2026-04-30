import { CommonModule } from '@angular/common';
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
  imports: [CommonModule],
  templateUrl: './users-page.component.html',
  styleUrls: ['./users-page.component.css'],
})
class UsersPageComponent implements OnInit {
  private authService = inject(AuthService);
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

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.loadError = '';
    this.authService
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
          this.loadError = err?.error?.message || 'Failed to load users. Please try refreshing.';
          this.users = [];
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
}

export const usersRoutes: Routes = [
  {
    path: '',
    component: UsersPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN] },
  },
];
