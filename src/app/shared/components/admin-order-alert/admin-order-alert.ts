import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminOrderNotifyService } from '../../../core/services/admin-order-notify.service';
import { CopPipe } from '../../pipes/cop.pipe';

@Component({
  selector: 'app-admin-order-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CopPipe],
  template: `
    <div class="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4">
      @for (alert of notify.alerts(); track alert.id) {
        <div
          class="pointer-events-auto w-full max-w-sm animate-alert-in rounded-2xl border border-brand-200 bg-white p-4 shadow-lg"
          role="status"
          aria-live="polite"
        >
          <div class="flex items-start gap-3">
            <span
              class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500 text-lg text-white"
              aria-hidden="true"
            >
              🔔
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold text-gray-900">Nuevo pedido</p>
              <p class="mt-0.5 text-sm text-brand-600">#{{ alert.orderNumber }}</p>
              <p class="mt-1 truncate text-xs text-gray-500">
                {{ alert.customerName }} · {{ alert.total | cop }}
              </p>
              <a
                routerLink="/admin/pedidos"
                class="mt-2 inline-block text-xs font-semibold text-brand-500 hover:text-brand-600"
              >
                Ver pedidos →
              </a>
            </div>
            <button
              type="button"
              (click)="notify.dismiss(alert.id)"
              class="shrink-0 rounded-lg p-1 text-gray-400 transition hover:bg-cream-100 hover:text-gray-600"
              aria-label="Cerrar alerta"
            >
              ✕
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminOrderAlert {
  readonly notify = inject(AdminOrderNotifyService);
}
