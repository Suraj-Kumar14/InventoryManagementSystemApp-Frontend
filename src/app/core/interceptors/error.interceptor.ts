import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router  = inject(Router);
  const toast   = inject(ToastService);

  return next(req).pipe(
    catchError(err => {
      const status  = err.status;
      const message = err.error?.message ?? err.message ?? 'An unexpected error occurred';

      if (status === 401) {
        // Handled by auth — redirect to login
        inject(AuthService).logout();
      } else if (status === 403) {
        toast.error('Access Denied', 'You do not have permission for this action.');
      } else if (status === 404) {
        toast.error('Not Found', message);
      } else if (status === 0 || status === 503) {
        toast.error('Service Unavailable', 'Cannot reach the server. Check your connection.');
      } else if (status >= 500) {
        toast.error('Server Error', message);
      }

      return throwError(() => err);
    })
  );
};
