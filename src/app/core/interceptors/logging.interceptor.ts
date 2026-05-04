import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const startedAt = performance.now();

    console.debug('[HTTP] Request', {
      method: req.method,
      urlWithParams: req.urlWithParams,
      hasAuthHeader: req.headers.has('Authorization'),
    });

    return next.handle(req).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            console.debug('[HTTP] Response', {
              method: req.method,
              urlWithParams: req.urlWithParams,
              status: event.status,
              hasAuthHeader: req.headers.has('Authorization'),
              durationMs: Math.round(performance.now() - startedAt),
            });
          }
        },
        error: (error) => {
          console.error('[HTTP] Error', {
            method: req.method,
            urlWithParams: req.urlWithParams,
            status: error?.status ?? 'UNKNOWN',
            errorBody: error?.error ?? null,
            hasAuthHeader: req.headers.has('Authorization'),
            durationMs: Math.round(performance.now() - startedAt),
          });
        },
      })
    );
  }
}
