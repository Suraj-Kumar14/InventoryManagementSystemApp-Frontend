import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ToastService } from '../../../core/services/toast.service';

interface AdminUser {
  id: number; firstName: string; lastName: string;
  email: string; role: string; active: boolean; createdAt: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, DataTableComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  http  = inject(HttpClient);
  toast = inject(ToastService);

  users         = signal<AdminUser[]>([]);
  totalElements = signal(0);
  page          = signal(0);
  loading       = signal(true);

  adminTab = signal<'users' | 'system'>('users');

  columns: TableColumn<AdminUser>[] = [
    { key: 'firstName', label: 'First Name',  width: '130px', sortable: true },
    { key: 'lastName',  label: 'Last Name',   width: '130px' },
    { key: 'email',     label: 'Email',                       sortable: true },
    { key: 'role',      label: 'Role',        width: '160px',
      render: r => `<span class="badge badge-primary">${(r['role'] as string).replace('ROLE_','').replace('_',' ')}</span>` },
    { key: 'active',    label: 'Status',      width: '90px',
      render: r => r['active'] ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-gray">Inactive</span>' },
    { key: 'createdAt', label: 'Joined',      width: '110px',
      render: r => new Date(r['createdAt'] as string).toLocaleDateString('en-IN') }
  ];

  ngOnInit(): void { this.loadUsers(); }

  loadUsers(): void {
    this.loading.set(true);
    this.http.get<{ content: AdminUser[]; totalElements: number }>(
      `${environment.apiUrl}/api/v1/auth/admin/users?page=${this.page()}&size=20`
    ).subscribe({
      next: r => { this.users.set(r.content); this.totalElements.set(r.totalElements); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  onPageChange(p: number): void { this.page.set(p); this.loadUsers(); }

  toggleUserStatus(user: AdminUser): void {
    const action = user.active ? 'deactivate' : 'activate';
    this.http.patch(`${environment.apiUrl}/api/v1/auth/admin/users/${user.id}/${action}`, {}).subscribe({
      next: () => { this.toast.success(`User ${action}d`); this.loadUsers(); },
      error: () => this.toast.error('Action failed')
    });
  }
}
