import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../models/models';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? true : inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? inject(Router).createUrlTree(['/dashboard']) : true;
};

/** Usage: canActivate: [roleGuard('Admin', 'Manager')] */
export const roleGuard = (...roles: UserRole[]): CanActivateFn => () => {
  if (inject(AuthService).hasRole(...roles)) return true;
  inject(ToastService).error('You do not have access to that page.');
  return inject(Router).createUrlTree(['/dashboard']);
};
