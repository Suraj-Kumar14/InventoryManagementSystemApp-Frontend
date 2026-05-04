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
import { NotificationService } from '../services/notification.service';
import { TokenService } from '../auth/services/token.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private router = inject(Router);
  private tokenService = inject(TokenService);
  private notification = inject(NotificationService);
  private readonly recentErrors = new Map<string, number>();
  private readonly duplicateWindowMs = 1500;

  private readonly publicAuthEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/send-otp',
    '/auth/verify-otp',
    '/auth/reset-password',
    '/auth/refresh',
    '/oauth2/authorization/google',
    '/login/oauth2/code/google',
  ];

  private readonly sessionEndpoints = ['/auth/profile', '/auth/logout', '/auth/refresh'];

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        this.handleError(req, error);
        return throwError(() => error);
      })
    );
  }

  private handleError(request: HttpRequest<any>, error: HttpErrorResponse): void {
    if (this.shouldSkipGlobalHandling(request, error)) {
      return;
    }

    if (this.isDuplicateError(request, error)) {
      return;
    }

    const message = this.extractMessage(error);

    switch (error.status) {
      case 0:
        this.notification.error(
          'Unable to reach the backend services. Please check that the API gateway and required services are running.',
          'Connection Error'
        );
        break;

      case 401:
        if (!this.isPublicAuthRequest(error.url)) {
          if (this.shouldForceLogout(error.url)) {
            this.tokenService.clear();
            this.router.navigate(['/login']);
            this.notification.error('Your session has expired. Please login again.', 'Session Expired');
          } else {
            this.notification.error(message || 'You are not authorized to access this resource.', 'Unauthorized');
          }
        } else {
          this.notification.error(message || 'Unauthorized request.', 'Unauthorized');
        }
        break;

      case 403:
        if (this.isPublicAuthRequest(error.url)) {
          this.notification.error(message || 'You are not allowed to perform this action', 'Access Denied');
        }
        break;

      case 400:
        this.notification.error(message, 'Validation Error');
        break;

      case 404:
        this.notification.error(message || 'Resource not found.', 'Not Found');
        break;

      case 409:
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

    if (error.error?.error && typeof error.error.error === 'string') {
      return error.error.error;
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

  private shouldForceLogout(url: string | null): boolean {
    if (!url) {
      return true;
    }

    return this.sessionEndpoints.some((endpoint) => url.includes(endpoint));
  }

  private isReportRequest(url: string | null): boolean {
    return !!url && url.includes('/api/v1/reports/');
  }

  private shouldSkipGlobalHandling(request: HttpRequest<any>, error: HttpErrorResponse): boolean {
    return request.headers.has('X-Skip-Global-Error') && error.status !== 401;
  }

  private isDuplicateError(request: HttpRequest<any>, error: HttpErrorResponse): boolean {
    const key = `${request.method}:${request.urlWithParams}:${error.status}`;
    const now = Date.now();
    const lastSeenAt = this.recentErrors.get(key);

    this.recentErrors.set(key, now);
    return !!lastSeenAt && now - lastSeenAt < this.duplicateWindowMs;
  }
}
