import { Injectable, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private toastr = inject(ToastrService);

  /**
   * Show success notification
   */
  success(message: string, title = 'Success'): void {
    this.toastr.success(message, title, {
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
    this.toastr.error(message, title, {
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
    this.toastr.warning(message, title, {
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
    this.toastr.info(message, title, {
      timeOut: 3000,
      positionClass: 'toast-top-right',
      progressBar: true,
      progressAnimation: 'increasing',
    });
  }
}

