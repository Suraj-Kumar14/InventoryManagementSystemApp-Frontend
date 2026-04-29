import { Injectable, inject } from '@angular/core';
import {
  Router,
  CanActivateFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { UserRole } from '../../shared/config/app-config';

@Injectable({
  providedIn: 'root',
})
export class RoleGuardService {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    // Get required roles from route data
    const requiredRoles = route.data['roles'] as UserRole[] | undefined;

    if (!requiredRoles || requiredRoles.length === 0) {
      // If no roles are specified, allow access
      return true;
    }

    // Check if user has required role
    if (this.authService.hasRole(requiredRoles)) {
      return true;
    }

    // User doesn't have required role
    this.router.navigate(['/403']);
    return false;
  }
}

export const roleGuard: CanActivateFn = (route, state) => {
  const roleGuardService = inject(RoleGuardService);
  return roleGuardService.canActivate(route, state);
};

