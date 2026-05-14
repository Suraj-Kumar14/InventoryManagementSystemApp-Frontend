import { Component, ElementRef, EventEmitter, HostListener, Output, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { AlertBellComponent } from '../../../features/alerts/components/alert-bell/alert-bell.component';
import { ROLE_LABELS, UserRole } from '../../config/app-config';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, AlertBellComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  authService = inject(AuthService);
  private router = inject(Router);
  @ViewChild('userMenuContainer', { static: true }) private userMenuContainer?: ElementRef<HTMLElement>;

  @Output() toggleSidebar = new EventEmitter<void>();
  showUserMenu = false;

  getDisplayName(name?: string | null, email?: string | null): string {
    return this.authService.getFirstName(name, email);
  }

  getInitials(name: string): string {
    return name.split(' ').map((s) => s[0]).join('').toUpperCase().slice(0, 2);
  }

  getRoleLabel(role: string): string {
    return ROLE_LABELS[role as UserRole] || role;
  }

  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showUserMenu = !this.showUserMenu;
  }

  keepMenuOpen(event: MouseEvent): void {
    event.stopPropagation();
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    const container = this.userMenuContainer?.nativeElement;

    if (!this.showUserMenu || !container || !target) {
      return;
    }

    if (!container.contains(target)) {
      this.showUserMenu = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.showUserMenu = false;
  }
}
