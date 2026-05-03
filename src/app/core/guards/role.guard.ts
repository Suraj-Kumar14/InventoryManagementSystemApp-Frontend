import { Injectable, inject } from '@angular/core';
import {
  Router,
  CanActivateFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { ROLE_PAGES, UserRole } from '../../shared/config/app-config';

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
    const allowAdminOverride = route.data['allowAdminOverride'] as boolean | undefined;
    const redirectUnauthorizedToRoleHome = route.data['redirectUnauthorizedToRoleHome'] as boolean | undefined;
    const currentRole = this.authService.getUserRole();

    if (!requiredRoles || requiredRoles.length === 0) {
      // If no roles are specified, allow access
      return true;
    }

    if (currentRole === UserRole.ADMIN && allowAdminOverride === false && !requiredRoles.includes(UserRole.ADMIN)) {
      this.router.navigate([ROLE_PAGES[UserRole.ADMIN]]);
      return false;
    }

    // Check if user has required role
    if (this.authService.hasRole(requiredRoles)) {
      return true;
    }

    // User doesn't have required role
    if (redirectUnauthorizedToRoleHome && currentRole) {
      this.router.navigate([ROLE_PAGES[currentRole]]);
      return false;
    }

    this.router.navigate(['/403']);
    return false;
  }
}

export const roleGuard: CanActivateFn = (route, state) => {
  const roleGuardService = inject(RoleGuardService);
  return roleGuardService.canActivate(route, state);
};

