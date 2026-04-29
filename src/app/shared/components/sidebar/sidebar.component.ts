import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { UserRole } from '../../config/app-config';

interface MenuItem {
  label: string;
  route: string;
  roles: UserRole[];
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="bg-white border-r border-neutral-200 h-screen overflow-y-auto" [ngClass]="isCollapsed ? 'w-20' : 'w-64'">
      <nav class="p-4 space-y-2">
        <ng-container *ngFor="let item of getMenuItems()">
          <a
            [routerLink]="item.route"
            routerLinkActive="bg-primary-100 text-primary-600"
            class="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-all"
            [title]="item.label"
          >
            <span class="text-xl flex-shrink-0">{{ item.icon }}</span>
            <span *ngIf="!isCollapsed" class="text-sm font-medium">{{ item.label }}</span>
          </a>
        </ng-container>

        <a
          routerLink="/settings"
          routerLinkActive="bg-primary-100 text-primary-600"
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-all mt-6"
          title="Settings"
        >
          <span class="text-xl flex-shrink-0">Settings</span>
          <span *ngIf="!isCollapsed" class="text-sm font-medium">Settings</span>
        </a>
      </nav>
    </aside>
  `,
})
export class SidebarComponent {
  @Input() isCollapsed = false;
  private authService = inject(AuthService);

  private readonly menuItems: MenuItem[] = [
    { label: 'Dashboard', route: '/dashboard/admin', roles: [UserRole.ADMIN], icon: 'A' },
    { label: 'Dashboard', route: '/dashboard/manager', roles: [UserRole.MANAGER], icon: 'M' },
    { label: 'Dashboard', route: '/dashboard/officer', roles: [UserRole.OFFICER], icon: 'P' },
    { label: 'Dashboard', route: '/dashboard/staff', roles: [UserRole.STAFF], icon: 'W' },
    { label: 'Users', route: '/admin/users', roles: [UserRole.ADMIN], icon: 'U' },
    { label: 'Warehouses', route: '/admin/warehouses', roles: [UserRole.ADMIN], icon: 'H' },
    { label: 'Audit Logs', route: '/admin/logs', roles: [UserRole.ADMIN], icon: 'L' },
    { label: 'Products', route: '/inventory/products', roles: [UserRole.MANAGER, UserRole.ADMIN], icon: 'P' },
    { label: 'Stock Levels', route: '/inventory/stock', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF], icon: 'S' },
    { label: 'Alerts', route: '/inventory/alerts', roles: [UserRole.MANAGER, UserRole.ADMIN], icon: 'A' },
    { label: 'Purchase Orders', route: '/purchase/orders', roles: [UserRole.OFFICER, UserRole.ADMIN], icon: 'O' },
    { label: 'Suppliers', route: '/purchase/suppliers', roles: [UserRole.OFFICER, UserRole.ADMIN], icon: 'V' },
    { label: 'Stock Movements', route: '/warehouse/movements', roles: [UserRole.STAFF, UserRole.ADMIN], icon: 'M' },
    { label: 'Bin Locations', route: '/warehouse/bins', roles: [UserRole.STAFF, UserRole.ADMIN], icon: 'B' },
    { label: 'Reports', route: '/reports', roles: [UserRole.ADMIN, UserRole.MANAGER], icon: 'R' },
  ];

  getMenuItems(): MenuItem[] {
    const userRole = this.authService.getUserRole();
    if (!userRole) {
      return [];
    }

    return this.menuItems.filter((item) => item.roles.includes(userRole) || userRole === UserRole.ADMIN);
  }
}
