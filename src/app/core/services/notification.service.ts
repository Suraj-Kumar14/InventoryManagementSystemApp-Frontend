import { Injectable, NgZone, inject } from '@angular/core';
import { IndividualConfig, ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private toastr = inject(ToastrService);
  private zone = inject(NgZone);
  private lastToastKey = '';
  private lastToastAt = 0;

  /**
   * Show success notification
   */
  success(message: string, title = 'Success'): void {
    this.show('success', message, title, {
      timeOut: 3000,
      positionClass: 'toast-top-right',
      progressBar: true,
      progressAnimation: 'increasing',
    });
  }

  /**
   * Show error notification
   */
  error(message: string, title = 'Error'): void {
    this.show('error', message, title, {
      timeOut: 5000,
      positionClass: 'toast-top-right',
      progressBar: true,
      progressAnimation: 'increasing',
    });
  }

  /**
   * Show warning notification
   */
  warning(message: string, title = 'Warning'): void {
    this.show('warning', message, title, {
      timeOut: 4000,
      positionClass: 'toast-top-right',
      progressBar: true,
      progressAnimation: 'increasing',
    });
  }

  /**
   * Show info notification
   */
  info(message: string, title = 'Info'): void {
    this.show('info', message, title, {
      timeOut: 3000,
      positionClass: 'toast-top-right',
      progressBar: true,
      progressAnimation: 'increasing',
    });
  }

  private show(
    type: 'success' | 'error' | 'warning' | 'info',
    message: string,
    title: string,
    options: Partial<IndividualConfig>
  ): void {
    const key = `${type}:${title}:${message}`;
    const now = Date.now();
    if (key === this.lastToastKey && now - this.lastToastAt < 1000) {
      return;
    }

    this.lastToastKey = key;
    this.lastToastAt = now;

    this.zone.run(() => {
      setTimeout(() => this.toastr[type](message, title, options));
    });
  }
}

