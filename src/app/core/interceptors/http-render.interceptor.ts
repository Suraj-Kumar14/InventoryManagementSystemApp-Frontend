import { ApplicationRef, Injectable, inject } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';

@Injectable()
export class HttpRenderInterceptor implements HttpInterceptor {
  private readonly appRef = inject(ApplicationRef);
  private renderQueued = false;

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          this.queueRender();
        }
      }),
      finalize(() => this.queueRender())
    );
  }

  private queueRender(): void {
    if (this.renderQueued) {
      return;
    }

    this.renderQueued = true;
    queueMicrotask(() => {
      this.renderQueued = false;
      try {
        this.appRef.tick();
      } catch (error) {
        console.error('[HTTP RENDER] Change detection tick failed', error);
      }
    });
  }
}
