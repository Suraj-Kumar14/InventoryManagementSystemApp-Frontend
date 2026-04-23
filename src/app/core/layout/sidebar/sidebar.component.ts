import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { roleMatches } from '../../constants/roles';
import { AuthService } from '../../services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  collapsed = signal(false);

  constructor(public auth: AuthService) {}

  toggleCollapse(): void {
    this.collapsed.update((value) => !value);
  }

  navItems = computed<NavItem[]>(() => {
    const role = this.auth.currentUser()?.role ?? '';
    const all: NavItem[] = [
      { label: 'Dashboard', icon: 'DS', route: '/dashboard' },
      {
        label: 'Products',
        icon: 'PR',
        route: '/products',
        roles: ['ADMIN', 'MANAGER', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF', 'PURCHASE_OFFICER']
      },
      { label: 'Warehouses', icon: 'WH', route: '/warehouses', roles: ['ROLE_ADMIN', 'ROLE_INVENTORY_MANAGER'] },
      { label: 'Stock', icon: 'ST', route: '/stock', roles: ['ROLE_ADMIN', 'ROLE_INVENTORY_MANAGER', 'ROLE_WAREHOUSE_STAFF'] },
      {
        label: 'Purchase Orders',
        icon: 'PO',
        route: '/purchase-orders',
        roles: ['ROLE_ADMIN', 'ROLE_PURCHASE_OFFICER', 'ROLE_INVENTORY_MANAGER']
      },
      { label: 'Suppliers', icon: 'SU', route: '/suppliers', roles: ['ROLE_ADMIN', 'ROLE_PURCHASE_OFFICER'] },
      { label: 'Movements', icon: 'MV', route: '/movements', roles: ['ROLE_ADMIN', 'ROLE_INVENTORY_MANAGER', 'ROLE_WAREHOUSE_STAFF'] },
      { label: 'Alerts', icon: 'AL', route: '/alerts' },
      { label: 'Reports', icon: 'RP', route: '/reports', roles: ['ROLE_ADMIN', 'ROLE_INVENTORY_MANAGER', 'ROLE_PURCHASE_OFFICER'] },
      { label: 'Admin', icon: 'AD', route: '/admin', roles: ['ROLE_ADMIN'] }
    ];

    return all.filter((item) => !item.roles || item.roles.some((allowedRole) => roleMatches(role, allowedRole)));
  });
}
