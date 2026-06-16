import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  Order,
  OrderStatus,
  ORDER_STATUS_LABELS,
} from '../../../core/models/order.model';
import { AdminOrderNotifyService } from '../../../core/services/admin-order-notify.service';
import { OrderService } from '../../../core/services/order.service';
import { StatusSlider } from '../../../shared/components/status-slider/status-slider';
import { CopPipe } from '../../../shared/pipes/cop.pipe';
import { DateCoPipe } from '../../../shared/pipes/date-co.pipe';
import { TimeCoPipe } from '../../../shared/pipes/time-co.pipe';

type Filter = OrderStatus | 'all';

@Component({
  selector: 'app-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CopPipe, DateCoPipe, TimeCoPipe, StatusSlider],
  template: `
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="adm-heading">Pedidos</h1>
        <p class="adm-subheading">Desliza para avanzar cada pedido al siguiente estado.</p>
      </div>
      <button type="button" (click)="load()" class="adm-btn-ghost">Actualizar</button>
    </div>

    <div class="mb-5 flex flex-wrap gap-2">
      <button
        type="button"
        (click)="filter.set('all')"
        class="adm-chip"
        [class.adm-chip-active]="filter() === 'all'"
      >
        Todos ({{ orders().length }})
      </button>
      @for (status of statusOptions; track status) {
        <button
          type="button"
          (click)="filter.set(status)"
          class="adm-chip"
          [class.adm-chip-active]="filter() === status"
        >
          {{ statusLabels[status] }} ({{ countByStatus()[status] }})
        </button>
      }
    </div>

    @if (loading()) {
      <p class="text-sm" [style.color]="'var(--adm-text-muted)'">Cargando...</p>
    } @else if (filtered().length === 0) {
      <div class="adm-card p-8 text-center">
        <p class="text-sm" [style.color]="'var(--adm-text-muted)'">No hay pedidos en este filtro.</p>
      </div>
    } @else {
      <div class="adm-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        @for (order of filtered(); track order.id) {
          <div class="adm-card adm-card-interactive flex flex-col p-4">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="truncate text-sm font-bold" [style.color]="'var(--adm-text)'">#{{ order.orderNumber }}</p>
                <p class="truncate text-sm" [style.color]="'var(--adm-text-secondary)'">{{ order.customerName }}</p>
                <p class="mt-1 line-clamp-2 text-xs leading-snug" [style.color]="'var(--adm-text-muted)'">
                  <span class="font-medium">Dirección:</span> {{ order.address }}
                </p>
              </div>
              <span [class]="badgeClass(order.status)">{{ statusLabels[order.status] }}</span>
            </div>

            @if (order.items.length > 0) {
              <ul class="adm-divider mt-3 space-y-1.5 border-t pt-3">
                @for (item of order.items; track item.id) {
                  <li class="flex items-start justify-between gap-2 text-xs">
                    <span class="min-w-0 flex-1 leading-snug" [style.color]="'var(--adm-text-secondary)'">
                      <span class="font-semibold" [style.color]="'var(--adm-text)'">{{ item.quantity }}×</span>
                      {{ item.productName }}
                    </span>
                    <span class="shrink-0 font-medium" [style.color]="'var(--adm-text)'">{{ item.subtotal | cop }}</span>
                  </li>
                }
              </ul>
              <div class="adm-divider mt-2 space-y-0.5 border-t border-dashed pt-2 text-[11px]" [style.color]="'var(--adm-text-muted)'">
                <div class="flex justify-between"><span>Subtotal</span><span>{{ order.subtotal | cop }}</span></div>
                @if (order.shippingCost > 0) {
                  <div class="flex justify-between"><span>Domicilio</span><span>{{ order.shippingCost | cop }}</span></div>
                }
              </div>
            } @else {
              <p class="adm-divider mt-3 border-t pt-3 text-xs" [style.color]="'var(--adm-text-muted)'">Sin detalle de productos.</p>
            }

            @if (order.notes) {
              <p class="mt-2 line-clamp-2 text-[11px] italic" [style.color]="'var(--adm-text-muted)'">Nota: {{ order.notes }}</p>
            }

            <div class="adm-divider mt-3 flex items-center justify-between border-t pt-3">
              <p class="text-xs" [style.color]="'var(--adm-text-muted)'">{{ order.deliveryDate | dateCo }} · {{ order.deliveryTime | timeCo }}</p>
              <p class="text-base font-bold text-[var(--adm-primary)]">{{ order.total | cop }}</p>
            </div>

            <div class="mt-4">
              <app-status-slider [status]="order.status" (advance)="advanceStatus(order, $event)" />
              @if (order.status !== 'delivered' && order.status !== 'cancelled') {
                <button
                  type="button"
                  (click)="cancelOrder(order)"
                  class="mt-2 w-full text-center text-[11px] font-medium transition hover:text-red-500"
                  [style.color]="'var(--adm-text-muted)'"
                >
                  Cancelar pedido
                </button>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class Orders implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly orderNotify = inject(AdminOrderNotifyService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statusLabels = ORDER_STATUS_LABELS;
  readonly statusOptions = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];
  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly filter = signal<Filter>('all');

  private readonly badgeClasses: Record<OrderStatus, string> = {
    pending_payment: 'adm-badge-warning',
    payment_validated: 'adm-badge-info',
    preparing: 'adm-badge-violet',
    on_the_way: 'adm-badge-blue',
    delivered: 'adm-badge-success',
    cancelled: 'adm-badge-muted',
  };

  readonly filtered = computed(() => {
    const f = this.filter();
    const all = this.orders();
    return f === 'all' ? all : all.filter((o) => o.status === f);
  });

  readonly countByStatus = computed(() => {
    const counts = {} as Record<OrderStatus, number>;
    for (const status of this.statusOptions) {
      counts[status] = 0;
    }
    for (const order of this.orders()) {
      counts[order.status] = (counts[order.status] ?? 0) + 1;
    }
    return counts;
  });

  badgeClass(status: OrderStatus): string {
    return 'adm-badge ' + this.badgeClasses[status];
  }

  async ngOnInit(): Promise<void> {
    await this.load();

    const stopLive = this.orderNotify.onChange(() => {
      void this.refreshSilently();
    });
    this.destroyRef.onDestroy(stopLive);
  }

  async refreshSilently(): Promise<void> {
    try {
      this.orders.set(await this.orderService.list());
    } catch {
      /* Mantiene la lista actual si falla la actualización en segundo plano. */
    }
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.orders.set(await this.orderService.list());
    } catch {
      this.orders.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async advanceStatus(order: Order, next: OrderStatus): Promise<void> {
    await this.setStatus(order, next);
  }

  async cancelOrder(order: Order): Promise<void> {
    const ok = confirm(`¿Cancelar el pedido #${order.orderNumber}? Esta acción no se puede revertir.`);
    if (!ok) {
      return;
    }
    await this.setStatus(order, 'cancelled');
  }

  private async setStatus(order: Order, status: OrderStatus): Promise<void> {
    if (!order.id) {
      return;
    }
    try {
      await this.orderService.updateStatus(order.id, status);
      this.orders.update((list) =>
        list.map((o) => (o.id === order.id ? { ...o, status } : o)),
      );
    } catch (err) {
      console.error('No se pudo actualizar el estado', err);
    }
  }
}
