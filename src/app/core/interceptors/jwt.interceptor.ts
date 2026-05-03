import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from '../auth/services/token.service';
import { API_ENDPOINTS } from '../../shared/config/app-config';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private readonly publicEndpoints = [
    API_ENDPOINTS.AUTH.LOGIN,
    API_ENDPOINTS.AUTH.REGISTER,
    '/api/v1/auth/register',
    '/api/v1/auth/register-request',
    API_ENDPOINTS.AUTH.REFRESH_TOKEN,
    '/api/v1/auth/refresh-token',
    API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
    API_ENDPOINTS.AUTH.VERIFY_OTP,
    API_ENDPOINTS.AUTH.RESET_PASSWORD,
    '/auth/send-otp',
    '/api/v1/auth/login',
    '/api/v1/auth/verify-otp',
    API_ENDPOINTS.AUTH.GOOGLE_LOGIN,
    '/login/oauth2/code/google',
  ];

  constructor(private tokenService: TokenService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.isPublicEndpoint(req.url)) {
      return next.handle(req);
    }

    const token = this.tokenService.getToken();
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(req);
  }

  private isPublicEndpoint(url: string): boolean {
    return this.publicEndpoints.some((endpoint) => url.includes(endpoint));
  }
}

