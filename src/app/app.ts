import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AdminPwaService } from './core/services/admin-pwa.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet />`,
})
export class App {
  /** Inicializa el control de PWA solo-admin al arrancar la app. */
  constructor(_adminPwa: AdminPwaService) {}
}
