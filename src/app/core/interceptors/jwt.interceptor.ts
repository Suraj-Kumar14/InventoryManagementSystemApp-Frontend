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
    API_ENDPOINTS.AUTH.REFRESH_TOKEN,
    API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
    API_ENDPOINTS.AUTH.VERIFY_OTP,
    API_ENDPOINTS.AUTH.RESET_PASSWORD,
    '/auth/send-otp',
    API_ENDPOINTS.AUTH.GOOGLE_LOGIN,
    '/login/oauth2/code/google',
  ];

  constructor(private tokenService: TokenService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.isPublicEndpoint(req.url)) {
      console.debug('[AUTH HEADER]', {
        url: req.url,
        hasToken: !!this.tokenService.getToken(),
        attaching: false,
      });
      return next.handle(req);
    }

    const token = this.tokenService.getToken();
    console.debug('[AUTH HEADER]', {
      url: req.url,
      hasToken: !!token,
      attaching: !!token,
    });

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

