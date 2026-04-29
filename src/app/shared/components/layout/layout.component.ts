import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent],
  template: `
    <div class="h-screen flex flex-col bg-neutral-50">
      <!-- Navbar -->
      <app-navbar (toggleSidebar)="sidebarCollapsed.set(!sidebarCollapsed())">
      </app-navbar>

      <!-- Main Content Area -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar -->
        <app-sidebar [isCollapsed]="sidebarCollapsed()"></app-sidebar>

        <!-- Main Content -->
        <main class="flex-1 overflow-y-auto">
          <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `,
})
export class LayoutComponent {
  sidebarCollapsed = signal(false);
}

