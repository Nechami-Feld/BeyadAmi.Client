import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../../models/user-role';
import { AuthService } from '../../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    authService.setRedirectUrl(state.url);
    router.navigate(['/login']);
    return false;
  }

  if (authService.getRole() === UserRole.Admin) {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};
