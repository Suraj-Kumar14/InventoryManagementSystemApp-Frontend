import { Component, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
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
    this.collapsed.update(v => !v);
  }

  navItems = computed<NavItem[]>(() => {
    const role = this.auth.currentUser()?.role ?? '';
    const all: NavItem[] = [
      { label: 'Dashboard',       icon: '📊', route: '/dashboard' },
      { label: 'Products',        icon: '📦', route: '/products',        roles: ['ROLE_ADMIN','ROLE_INVENTORY_MANAGER'] },
      { label: 'Warehouses',      icon: '🏭', route: '/warehouses',      roles: ['ROLE_ADMIN','ROLE_INVENTORY_MANAGER'] },
      { label: 'Stock',           icon: '📋', route: '/stock',           roles: ['ROLE_ADMIN','ROLE_INVENTORY_MANAGER','ROLE_WAREHOUSE_STAFF'] },
      { label: 'Purchase Orders', icon: '🛒', route: '/purchase-orders', roles: ['ROLE_ADMIN','ROLE_PURCHASE_OFFICER','ROLE_INVENTORY_MANAGER'] },
      { label: 'Suppliers',       icon: '🤝', route: '/suppliers',       roles: ['ROLE_ADMIN','ROLE_PURCHASE_OFFICER'] },
      { label: 'Movements',       icon: '🔄', route: '/movements',       roles: ['ROLE_ADMIN','ROLE_INVENTORY_MANAGER','ROLE_WAREHOUSE_STAFF'] },
      { label: 'Alerts',          icon: '🔔', route: '/alerts' },
      { label: 'Reports',         icon: '📈', route: '/reports',         roles: ['ROLE_ADMIN','ROLE_INVENTORY_MANAGER','ROLE_PURCHASE_OFFICER'] },
      { label: 'Admin',           icon: '⚙️', route: '/admin',           roles: ['ROLE_ADMIN'] },
    ];
    return all.filter(item => !item.roles || item.roles.includes(role));
  });
}
