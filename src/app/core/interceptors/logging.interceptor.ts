import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const startedAt = performance.now();

    console.debug('[HTTP] Request', {
      method: req.method,
      url: req.urlWithParams,
      hasAuthorizationHeader: req.headers.has('Authorization'),
    });

    return next.handle(req).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            console.debug('[HTTP] Response', {
              method: req.method,
              url: req.urlWithParams,
              status: event.status,
              body: event.body,
              hasAuthorizationHeader: req.headers.has('Authorization'),
              durationMs: Math.round(performance.now() - startedAt),
            });
          }
        },
        error: (error) => {
          const httpError = error as HttpErrorResponse;
          console.error('[HTTP] Error', {
            method: req.method,
            url: req.urlWithParams,
            status: httpError?.status ?? 'UNKNOWN',
            errorBody: httpError?.error ?? null,
            hasAuthorizationHeader: req.headers.has('Authorization'),
            durationMs: Math.round(performance.now() - startedAt),
          });
        },
      })
    );
  }
}
