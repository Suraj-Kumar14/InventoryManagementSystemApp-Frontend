import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ToastContainerComponent } from '../toast-container/toast-container.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent, ToastContainerComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
})
export class LayoutComponent implements OnInit {
  private readonly router = inject(Router);

  sidebarCollapsed = signal(false);
  sidebarOpen = signal(false);
  isMobile = signal(false);

  ngOnInit(): void {
    this.syncViewportState();
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      if (this.isMobile()) {
        this.sidebarOpen.set(false);
      }
    });
  }

  toggleSidebar(): void {
    if (this.isMobile()) {
      this.sidebarOpen.set(!this.sidebarOpen());
      return;
    }

    this.sidebarCollapsed.set(!this.sidebarCollapsed());
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.syncViewportState();
  }

  private syncViewportState(): void {
    const mobile = typeof window !== 'undefined' && window.innerWidth <= 960;
    this.isMobile.set(mobile);
    if (!mobile) {
      this.sidebarOpen.set(false);
    }
  }
}
