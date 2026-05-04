import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface AppToast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
  createdAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly toastsSubject = new BehaviorSubject<AppToast[]>([]);
  readonly toasts$ = this.toastsSubject.asObservable();

  private nextId = 1;
  private lastMessage = '';
  private lastShownAt = 0;

  private readonly duplicateWindowMs = 1500;
  private readonly maxOpened = 3;
  private readonly timeoutMs = 3000;

  success(message: string, title = 'Success'): void {
    this.show('success', message, title);
  }

  error(message: string, title = 'Error'): void {
    this.show('error', message, title);
  }

  warning(message: string, title = 'Warning'): void {
    this.show('warning', message, title);
  }

  info(message: string, title = 'Info'): void {
    this.show('info', message, title);
  }

  remove(id: number): void {
    this.toastsSubject.next(
      this.toastsSubject.value.filter((toast) => toast.id !== id)
    );
  }

  clear(): void {
    this.toastsSubject.next([]);
  }

  private show(type: ToastType, message: string, title: string): void {
    if (!message?.trim()) {
      return;
    }

    const now = Date.now();
    const duplicateKey = `${type}:${title}:${message}`;

    if (
      this.lastMessage === duplicateKey &&
      now - this.lastShownAt < this.duplicateWindowMs
    ) {
      return;
    }

    this.lastMessage = duplicateKey;
    this.lastShownAt = now;

    const toast: AppToast = {
      id: this.nextId++,
      type,
      title,
      message,
      createdAt: now,
    };

    const updated = [toast, ...this.toastsSubject.value].slice(0, this.maxOpened);
    this.toastsSubject.next(updated);

    window.setTimeout(() => {
      this.remove(toast.id);
    }, this.timeoutMs);
  }
}