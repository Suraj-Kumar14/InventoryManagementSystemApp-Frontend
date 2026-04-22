import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth    = inject(AuthService);
  const router  = inject(Router);
  const allowed = route.data['roles'] as string[] | undefined;

  if (!allowed || allowed.length === 0) return true;

  const user = auth.currentUser();
  if (!user) return router.createUrlTree(['/auth/login']);

  if (user.role && allowed.includes(user.role)) return true;

  // Redirect to dashboard with an access-denied state
  return router.createUrlTree(['/dashboard']);
};
