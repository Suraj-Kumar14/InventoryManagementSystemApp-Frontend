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
      url: req.urlWithParams,
    });

    return next.handle(req).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            console.debug('[HTTP] Response', {
              method: req.method,
              url: req.urlWithParams,
              status: event.status,
              durationMs: Math.round(performance.now() - startedAt),
            });
          }
        },
        error: (error) => {
          console.error('[HTTP] Error', {
            method: req.method,
            url: req.urlWithParams,
            status: error?.status ?? 'UNKNOWN',
            durationMs: Math.round(performance.now() - startedAt),
          });
        },
      })
    );
  }
}
