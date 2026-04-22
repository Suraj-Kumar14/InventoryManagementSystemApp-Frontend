import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastSvc.toasts(); track toast.id) {
        <div class="toast toast-{{ toast.type }}" (click)="toastSvc.remove(toast.id)">
          <span class="toast-icon">{{ icons[toast.type] }}</span>
          <div class="toast-body">
            <div class="toast-title">{{ toast.title }}</div>
            @if (toast.message) {
              <div class="toast-msg">{{ toast.message }}</div>
            }
          </div>
          <button class="toast-close" (click)="toastSvc.remove(toast.id)">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: var(--z-toast);
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      pointer-events: none;
    }
    .toast {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: var(--gray-900);
      color: #fff;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      min-width: 280px;
      max-width: 380px;
      animation: slideInRight 300ms ease;
      pointer-events: all;
      cursor: pointer;
      border-left: 4px solid transparent;
    }
    .toast-success { border-left-color: var(--color-success); }
    .toast-error   { border-left-color: var(--color-danger); }
    .toast-warning { border-left-color: var(--color-warning); }
    .toast-info    { border-left-color: var(--color-info); }
    .toast-icon { font-size: 1.125rem; flex-shrink: 0; margin-top: 1px; }
    .toast-body { flex: 1; min-width: 0; }
    .toast-title { font-size: 0.875rem; font-weight: 600; }
    .toast-msg { font-size: 0.8125rem; color: var(--gray-400); margin-top: 2px; }
    .toast-close {
      background: none; border: none; color: var(--gray-500);
      cursor: pointer; font-size: 0.75rem; padding: 2px; flex-shrink: 0;
      transition: color var(--transition-fast);
    }
    .toast-close:hover { color: #fff; }
  `]
})
export class ToastContainerComponent {
  toastSvc = inject(ToastService);
  icons: Record<string, string> = {
    success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️'
  };
}
