import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { ROLE_PAGES } from '../../shared/config/app-config';

@Injectable({
  providedIn: 'root',
})
export class GuestGuardService {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): boolean {
    if (!this.authService.isAuthenticated() || !this.authService.isTokenValid()) {
      return true;
    }

    const role = this.authService.getUserRole();
    this.router.navigateByUrl((role && ROLE_PAGES[role]) || '/dashboard/admin');
    return false;
  }
}

export const guestGuard: CanActivateFn = () => {
  const guard = inject(GuestGuardService);
  return guard.canActivate();
};
