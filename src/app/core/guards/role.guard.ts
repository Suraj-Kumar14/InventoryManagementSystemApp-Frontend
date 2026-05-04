import { Injectable, inject } from '@angular/core';
import {
  Router,
  CanActivateFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable, map } from 'rxjs';
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
  ): Observable<boolean | UrlTree> {
    return this.authService.waitUntilInitialized().pipe(
      map(() => {
        if (!this.authService.isAuthenticated()) {
          return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
        }

        const requiredRoles = route.data['roles'] as UserRole[] | undefined;
        const allowAdminOverride = route.data['allowAdminOverride'] as boolean | undefined;
        const redirectUnauthorizedToRoleHome = route.data['redirectUnauthorizedToRoleHome'] as boolean | undefined;
        const currentRole = this.authService.getUserRole();

        if (!requiredRoles || requiredRoles.length === 0) {
          return true;
        }

        if (currentRole === UserRole.ADMIN && allowAdminOverride === false && !requiredRoles.includes(UserRole.ADMIN)) {
          return this.router.parseUrl(ROLE_PAGES[UserRole.ADMIN]);
        }

        if (this.authService.hasRole(requiredRoles)) {
          return true;
        }

        if (redirectUnauthorizedToRoleHome && currentRole) {
          return this.router.parseUrl(ROLE_PAGES[currentRole]);
        }

        return this.router.parseUrl('/403');
      })
    );
  }
}

export const roleGuard: CanActivateFn = (route, state) => {
  const roleGuardService = inject(RoleGuardService);
  return roleGuardService.canActivate(route, state);
};

