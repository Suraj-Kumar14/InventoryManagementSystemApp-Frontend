import { inject } from "@angular/core";
import { CanActivateChildFn, CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  auth.clearSession();
  return router.createUrlTree(["/auth/login"]);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return router.createUrlTree(["/dashboard"]);
  }

  return true;
};

export const guestChildGuard: CanActivateChildFn = (childRoute, state) =>
  guestGuard(childRoute, state);
