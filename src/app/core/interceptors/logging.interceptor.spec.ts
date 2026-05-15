import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {
          provide: HTTP_INTERCEPTORS,
          useClass: LoggingInterceptor,
          multi: true,
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should log request metadata without exposing the authorization token', () => {
    const debugSpy = spyOn(console, 'debug');

    http
      .post('/api/test', { password: 'secret' }, { headers: { Authorization: 'Bearer top-secret-token' } })
      .subscribe();

    const request = httpMock.expectOne('/api/test');
    request.flush({ ok: true });

    expect(debugSpy).toHaveBeenCalled();
    const requestLog = debugSpy.calls.allArgs().find(([label]) => label === '[HTTP] Request');
    expect(requestLog).toBeDefined();
    const payload = requestLog?.[1] as Record<string, unknown>;
    expect(payload['hasAuthorizationHeader']).toBeTrue();
    expect(payload['url']).toBe('/api/test');
    expect(JSON.stringify(payload)).not.toContain('top-secret-token');
    expect(JSON.stringify(payload)).not.toContain('secret');
  });
});
