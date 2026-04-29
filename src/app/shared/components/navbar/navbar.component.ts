import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { ROLE_LABELS, UserRole } from '../../config/app-config';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="bg-white border-b border-neutral-200 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-3">
            <button
              (click)="toggleSidebar.emit()"
              class="p-2 hover:bg-neutral-100 rounded-lg hidden sm:flex items-center justify-center cursor-pointer"
            >
              <span class="text-xl">Menu</span>
            </button>
            <h1 class="text-xl font-bold text-primary-600">StockPro</h1>
          </div>

          <div class="flex items-center gap-4">
            <div class="text-right hidden sm:block">
              <p class="text-sm font-medium text-neutral-900">
                {{ (authService.currentUser$ | async)?.name || (authService.currentUser$ | async)?.email }}
              </p>
              <p class="text-xs text-neutral-500">
                {{ (authService.currentUser$ | async)?.role ? getRoleLabel((authService.currentUser$ | async)?.role!) : '' }}
              </p>
            </div>
            <div class="relative">
              <button
                (click)="showUserMenu = !showUserMenu"
                class="w-10 h-10 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center hover:bg-primary-700 transition-all"
              >
                {{ getInitials((authService.currentUser$ | async)?.name || (authService.currentUser$ | async)?.email || 'User') }}
              </button>

              <div *ngIf="showUserMenu" class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 z-50">
                <a routerLink="/settings/profile" class="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-t-lg">
                  Profile Settings
                </a>
                <button (click)="logout()" class="w-full text-left px-4 py-2 text-danger-600 hover:bg-danger-50 rounded-b-lg">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
})
export class NavbarComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  @Output() toggleSidebar = new EventEmitter<void>();

  showUserMenu = false;

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((segment) => segment[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getRoleLabel(role: string): string {
    return ROLE_LABELS[role as UserRole] || role;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
