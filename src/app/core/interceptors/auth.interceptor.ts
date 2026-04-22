import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenSvc = inject(TokenService);
  const token    = tokenSvc.getToken();
  const publicAuthEndpoints = [
    '/auth/user/login',
    '/auth/user/register-request',
    '/auth/user/register-user',
    '/auth/user/forgot-password/request',
    '/auth/user/forgot-password/verify',
    '/auth/user/forgot-password/reset'
  ];

  if (publicAuthEndpoints.some(path => req.url.includes(path))) {
    return next(req);
  }

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next(req);
};
