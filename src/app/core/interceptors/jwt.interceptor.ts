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
  // Public endpoints that should NOT have JWT token
  private publicEndpoints = [
    API_ENDPOINTS.AUTH.LOGIN,
    API_ENDPOINTS.AUTH.REGISTER,
    API_ENDPOINTS.AUTH.REFRESH_TOKEN,
    API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
    API_ENDPOINTS.AUTH.VERIFY_OTP,
    API_ENDPOINTS.AUTH.RESET_PASSWORD,
    '/auth/send-otp',
    API_ENDPOINTS.AUTH.GOOGLE_LOGIN,
  ];

  constructor(private tokenService: TokenService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip token injection for public endpoints
    if (this.isPublicEndpoint(req.url)) {
      return next.handle(req);
    }

    // Get token from storage
    const token = this.tokenService.getToken();
    if (token) {
      // Clone request and add Authorization header
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(req);
  }

  /**
   * Check if endpoint is public
   */
  private isPublicEndpoint(url: string): boolean {
    return this.publicEndpoints.some((endpoint) => url.includes(endpoint));
  }
}

