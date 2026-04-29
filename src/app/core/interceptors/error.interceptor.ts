import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private router = inject(Router);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private readonly publicAuthEndpoints = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/send-otp', '/auth/verify-otp', '/auth/reset-password'];

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  private handleError(error: HttpErrorResponse): void {
    const message = this.extractMessage(error);

    switch (error.status) {
      case 401:
        if (!this.isPublicAuthRequest(error.url)) {
          this.authService.logoutLocal();
          this.router.navigate(['/login']);
          this.notification.error('Your session has expired. Please login again.', 'Session Expired');
        } else {
          this.notification.error(message || 'Unauthorized request.', 'Unauthorized');
        }
        break;

      case 403:
        this.router.navigate(['/403']);
        this.notification.error('You are not allowed to access this module', 'Access Denied');
        break;

      case 400:
        this.notification.error(message, 'Validation Error');
        break;

      case 404:
        // Not Found
        this.notification.error(message || 'Resource not found.', 'Not Found');
        break;

      case 409:
        // Conflict
        this.notification.error(message || 'Conflict error occurred.', 'Conflict');
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        this.notification.error(message || 'Server error occurred. Please try again later.', 'Server Error');
        break;

      default:
        this.notification.error(message, 'Error');
    }
  }

  private extractMessage(error: HttpErrorResponse): string {
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }

    if (error.error?.message) {
      return error.error.message;
    }

    if (error.error && typeof error.error === 'object') {
      const values = Object.values(error.error as Record<string, unknown>)
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

      if (values.length > 0) {
        return values.join('\n');
      }
    }

    return error.message || 'An error occurred';
  }

  private isPublicAuthRequest(url: string | null): boolean {
    if (!url) {
      return false;
    }
    return this.publicAuthEndpoints.some((endpoint) => url.includes(endpoint));
  }
}

