import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { UserRole } from '../../config/app-config';

interface MenuItem {
  label: string;
  route: string;
  roles: UserRole[];
  iconClass: string;
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
    { label: 'Dashboard', route: '/dashboard/admin', roles: [UserRole.ADMIN], iconClass: 'bi bi-speedometer2' },
    { label: 'Dashboard', route: '/dashboard/manager', roles: [UserRole.MANAGER], iconClass: 'bi bi-speedometer2' },
    { label: 'Dashboard', route: '/dashboard/officer', roles: [UserRole.OFFICER], iconClass: 'bi bi-cart3' },
    { label: 'Dashboard', route: '/dashboard/staff', roles: [UserRole.STAFF], iconClass: 'bi bi-building' },
    { label: 'Users', route: '/admin/users', roles: [UserRole.ADMIN], iconClass: 'bi bi-people' },
    { label: 'Warehouses', route: '/admin/warehouses', roles: [UserRole.ADMIN], iconClass: 'bi bi-building' },
    { label: 'Audit Logs', route: '/admin/logs', roles: [UserRole.ADMIN], iconClass: 'bi bi-file-earmark-text' },
    {
      label: 'Products',
      route: '/products',
      roles: [UserRole.ADMIN, UserRole.MANAGER],
      iconClass: 'bi bi-box-seam',
    },
    {
      label: 'Barcode Lookup',
      route: '/products/barcode-lookup',
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
      iconClass: 'bi bi-search',
    },
    {
      label: 'Stock',
      route: '/inventory/stock',
      roles: [UserRole.MANAGER, UserRole.ADMIN],
      iconClass: 'bi bi-bar-chart-line',
    },
    {
      label: 'My Warehouse Stock',
      route: '/inventory/stock',
      roles: [UserRole.STAFF],
      iconClass: 'bi bi-box2-heart',
    },
    {
      label: 'Alerts',
      route: '/alerts',
      roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF, UserRole.OFFICER],
      iconClass: 'bi bi-bell',
    },
    {
      label: 'Alert Analytics',
      route: '/alerts/analytics',
      roles: [UserRole.MANAGER],
      iconClass: 'bi bi-bar-chart',
    },
    {
      label: 'Broadcast Alert',
      route: '/alerts/broadcast',
      roles: [UserRole.ADMIN],
      iconClass: 'bi bi-megaphone',
    },
    {
      label: 'Purchase Orders',
      route: '/purchase-orders',
      roles: [UserRole.OFFICER, UserRole.ADMIN, UserRole.MANAGER],
      iconClass: 'bi bi-cart3',
    },
    {
      label: 'Receive Goods / GRN',
      route: '/purchase-orders',
      roles: [UserRole.STAFF],
      iconClass: 'bi bi-box-arrow-in-down',
    },
    {
      label: 'Create Purchase Order',
      route: '/purchase-orders/create',
      roles: [UserRole.OFFICER],
      iconClass: 'bi bi-plus-square',
    },
    {
      label: 'Suppliers',
      route: '/suppliers',
      roles: [UserRole.OFFICER, UserRole.ADMIN],
      iconClass: 'bi bi-truck',
    },
    {
      label: 'Supplier Performance',
      route: '/suppliers/analytics',
      roles: [UserRole.OFFICER],
      iconClass: 'bi bi-clipboard-data',
    },
    {
      label: 'Stock Availability',
      route: '/stocks',
      roles: [UserRole.OFFICER],
      iconClass: 'bi bi-boxes',
    },
    {
      label: 'Low Stock Report',
      route: '/reports/inventory/low-stock',
      roles: [UserRole.OFFICER],
      iconClass: 'bi bi-exclamation-triangle',
    },
    {
      label: 'Payments',
      route: '/payments',
      roles: [UserRole.OFFICER, UserRole.ADMIN],
      iconClass: 'bi bi-cash-coin',
    },
    {
      label: 'Payment Approvals',
      route: '/payments/approvals',
      roles: [UserRole.ADMIN],
      iconClass: 'bi bi-check2-square',
    },
    {
      label: 'Movements',
      route: '/movements',
      roles: [UserRole.ADMIN, UserRole.MANAGER],
      iconClass: 'bi bi-arrow-left-right',
    },
    {
      label: 'Movement History',
      route: '/movements',
      roles: [UserRole.STAFF],
      iconClass: 'bi bi-arrow-left-right',
    },
    {
      label: 'Movement Analytics',
      route: '/movements/analytics',
      roles: [UserRole.MANAGER],
      iconClass: 'bi bi-graph-up-arrow',
    },
    {
      label: 'Movement Export',
      route: '/movements/export',
      roles: [UserRole.MANAGER],
      iconClass: 'bi bi-download',
    },
    {
      label: 'Bin Locations',
      route: '/warehouse/bins',
      roles: [UserRole.ADMIN],
      iconClass: 'bi bi-box2',
    },
    {
      label: 'Reports',
      route: '/reports',
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OFFICER],
      iconClass: 'bi bi-graph-up-arrow',
    },
    {
      label: 'Executive Reports',
      route: '/reports/executive',
      roles: [],
      iconClass: 'bi bi-kanban',
    },
    {
      label: 'Inventory Valuation',
      route: '/reports/inventory/valuation',
      roles: [UserRole.MANAGER],
      iconClass: 'bi bi-boxes',
    },
    {
      label: 'Warehouse Reports',
      route: '/reports/inventory/warehouse-stock',
      roles: [UserRole.STAFF],
      iconClass: 'bi bi-file-earmark-bar-graph',
    },
    {
      label: 'Purchase Reports',
      route: '/reports/purchase/summary',
      roles: [UserRole.OFFICER],
      iconClass: 'bi bi-receipt',
    },
  ];

  getMenuItems(): MenuItem[] {
    const userRole = this.authService.getUserRole();
    if (!userRole) {
      return [];
    }

    return this.menuItems.filter((item) => item.roles.includes(userRole));
  }

  logNavigation(item: MenuItem): void {
    if (item.route === '/admin/users') {
      console.log('Navigate to users clicked');
    }
  }
}
