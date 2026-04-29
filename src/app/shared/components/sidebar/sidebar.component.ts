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
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  @Input() isCollapsed = false;
  private authService = inject(AuthService);

  private readonly menuItems: MenuItem[] = [
    { label: 'Admin Dashboard',     route: '/dashboard/admin',   roles: [UserRole.ADMIN],   icon: '🛡️' },
    { label: 'Inventory Dashboard', route: '/dashboard/manager', roles: [UserRole.MANAGER], icon: '📦' },
    { label: 'Purchase Dashboard',  route: '/dashboard/officer', roles: [UserRole.OFFICER], icon: '🛒' },
    { label: 'Warehouse Dashboard', route: '/dashboard/staff',   roles: [UserRole.STAFF],   icon: '🏭' },
    { label: 'Users', route: '/admin/users', roles: [UserRole.ADMIN], icon: '👥' },
    { label: 'Warehouses', route: '/admin/warehouses', roles: [UserRole.ADMIN], icon: '🏭' },
    { label: 'Audit Logs', route: '/admin/logs', roles: [UserRole.ADMIN], icon: '📋' },
    { label: 'Products', route: '/inventory/products', roles: [UserRole.MANAGER, UserRole.ADMIN], icon: '📦' },
    { label: 'Stock Levels', route: '/inventory/stock', roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF], icon: '📊' },
    { label: 'Alerts', route: '/inventory/alerts', roles: [UserRole.MANAGER, UserRole.ADMIN], icon: '🔔' },
    { label: 'Purchase Orders', route: '/purchase/orders', roles: [UserRole.OFFICER, UserRole.ADMIN], icon: '🛒' },
    { label: 'Suppliers', route: '/purchase/suppliers', roles: [UserRole.OFFICER, UserRole.ADMIN], icon: '🤝' },
    { label: 'Stock Movements', route: '/warehouse/movements', roles: [UserRole.STAFF, UserRole.ADMIN], icon: '🔄' },
    { label: 'Bin Locations', route: '/warehouse/bins', roles: [UserRole.STAFF, UserRole.ADMIN], icon: '📍' },
    { label: 'Reports', route: '/reports', roles: [UserRole.ADMIN, UserRole.MANAGER], icon: '📈' },
  ];

  getMenuItems(): MenuItem[] {
    const userRole = this.authService.getUserRole();
    if (!userRole) return [];
    return this.menuItems.filter(
      (item) => item.roles.includes(userRole) || userRole === UserRole.ADMIN
    );
  }
}
