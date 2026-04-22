import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ToastContainerComponent } from '../../../shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, ToastContainerComponent],
  template: `
    <div class="shell">
      <app-sidebar />
      <div class="shell-main">
        <app-topbar />
        <main class="shell-content">
          <router-outlet />
        </main>
      </div>
    </div>
    <app-toast-container />
  `,
  styles: [`
    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    .shell-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--surface-bg);
    }
    .shell-content {
      flex: 1;
      overflow-y: auto;
      padding: 2rem 2.5rem;
    }
    @media (max-width: 768px) {
      .shell-content { padding: 1.25rem 1rem; }
    }
  `]
})
export class ShellComponent {}
