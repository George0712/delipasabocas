import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** Redirige al dashboard si el admin ya tiene sesión activa. */
export const adminGuestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (await auth.isAdmin()) {
    return router.parseUrl('/admin/dashboard');
  }
  return true;
};
