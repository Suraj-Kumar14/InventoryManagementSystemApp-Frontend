import { Injectable, inject } from '@angular/core';
import {
  Router,
  CanActivateFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuardService {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isAuthenticated() && this.authService.isTokenValid()) {
      return true;
    }

    // Redirect to login
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}

export const authGuard: CanActivateFn = (route, state) => {
  const authGuardService = inject(AuthGuardService);
  return authGuardService.canActivate(route, state);
};

