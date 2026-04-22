import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  success(title: string, message?: string): void { this.add('success', title, message); }
  error(title: string, message?: string): void   { this.add('error',   title, message); }
  warning(title: string, message?: string): void { this.add('warning', title, message); }
  info(title: string, message?: string): void    { this.add('info',    title, message); }

  remove(id: string): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  private add(type: ToastType, title: string, message?: string): void {
    const id = crypto.randomUUID();
    this.toasts.update(list => [...list, { id, type, title, message }]);
    setTimeout(() => this.remove(id), 4500);
  }
}
