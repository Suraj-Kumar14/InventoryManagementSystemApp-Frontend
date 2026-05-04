import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';
import { ROLE_PAGES } from '../../shared/config/app-config';

@Injectable({
  providedIn: 'root',
})
export class GuestGuardService {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.waitUntilInitialized().pipe(
      map(() => {
        if (!this.authService.isAuthenticated() || !this.authService.isTokenValid()) {
          return true;
        }

        const role = this.authService.getUserRole();
        return this.router.parseUrl((role && ROLE_PAGES[role]) || '/dashboard/admin');
      })
    );
  }
}

export const guestGuard: CanActivateFn = () => {
  const guard = inject(GuestGuardService);
  return guard.canActivate();
};
