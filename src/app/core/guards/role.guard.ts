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
    const requiredRoles = route.data['roles'] as UserRole[] | undefined;
    const allowAdminOverride = route.data['allowAdminOverride'] as boolean | undefined;
    const redirectUnauthorizedToRoleHome = route.data['redirectUnauthorizedToRoleHome'] as boolean | undefined;

    return this.authService.restoreSession().pipe(
      map((user) => {
        if (!user) {
          return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
        }

        if (!requiredRoles || requiredRoles.length === 0) {
          return true;
        }

        const currentRole = this.authService.getUserRole();
        if (!currentRole) {
          return this.router.createUrlTree(['/403']);
        }

        if (currentRole === UserRole.ADMIN && allowAdminOverride === false && !requiredRoles.includes(UserRole.ADMIN)) {
          return this.router.createUrlTree([ROLE_PAGES[UserRole.ADMIN]]);
        }

        if (this.authService.hasRole(requiredRoles)) {
          return true;
        }

        if (redirectUnauthorizedToRoleHome) {
          return this.router.createUrlTree([ROLE_PAGES[currentRole]]);
        }

        return this.router.createUrlTree(['/403']);
      })
    );
  }
}

export const roleGuard: CanActivateFn = (route, state) => {
  const roleGuardService = inject(RoleGuardService);
  return roleGuardService.canActivate(route, state);
};

