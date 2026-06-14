import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  Order,
  OrderStatus,
  ORDER_STATUS_LABELS,
} from '../../../core/models/order.model';
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
    <div class="mb-5 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p class="mt-0.5 text-sm text-gray-500">
          Desliza para avanzar cada pedido al siguiente estado.
        </p>
      </div>
      <button
        type="button"
        (click)="load()"
        class="rounded-xl border border-cream-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-cream-50"
      >
        Actualizar
      </button>
    </div>

    <!-- Filtros tipo chips -->
    <div class="mb-5 flex flex-wrap gap-2">
      <button
        type="button"
        (click)="filter.set('all')"
        class="rounded-full px-3 py-1.5 text-xs font-semibold transition"
        [class.bg-brand-500]="filter() === 'all'"
        [class.text-white]="filter() === 'all'"
        [class.bg-white]="filter() !== 'all'"
        [class.text-gray-600]="filter() !== 'all'"
        [class.border]="filter() !== 'all'"
        [class.border-cream-200]="filter() !== 'all'"
      >
        Todos ({{ orders().length }})
      </button>
      @for (status of statusOptions; track status) {
        <button
          type="button"
          (click)="filter.set(status)"
          class="rounded-full px-3 py-1.5 text-xs font-semibold transition"
          [class.bg-brand-500]="filter() === status"
          [class.text-white]="filter() === status"
          [class.bg-white]="filter() !== status"
          [class.text-gray-600]="filter() !== status"
          [class.border]="filter() !== status"
          [class.border-cream-200]="filter() !== status"
        >
          {{ statusLabels[status] }} ({{ countByStatus()[status] }})
        </button>
      }
    </div>

    @if (loading()) {
      <p class="text-sm text-gray-400">Cargando...</p>
    } @else if (filtered().length === 0) {
      <div class="rounded-2xl border border-cream-200 bg-white p-8 text-center">
        <p class="text-sm text-gray-400">No hay pedidos en este filtro.</p>
      </div>
    } @else {
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        @for (order of filtered(); track order.id) {
          <div
            class="flex flex-col rounded-2xl border border-cream-200 bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="truncate text-sm font-bold text-gray-900">
                  #{{ order.orderNumber }}
                </p>
                <p class="truncate text-sm text-gray-600">{{ order.customerName }}</p>
              </div>
              <span [class]="badgeClass(order.status)">
                {{ statusLabels[order.status] }}
              </span>
            </div>

            @if (order.items.length > 0) {
              <ul class="mt-3 space-y-1.5 border-t border-cream-100 pt-3">
                @for (item of order.items; track item.id) {
                  <li class="flex items-start justify-between gap-2 text-xs">
                    <span class="min-w-0 flex-1 leading-snug text-gray-600">
                      <span class="font-semibold text-gray-800">{{ item.quantity }}×</span>
                      {{ item.productName }}
                    </span>
                    <span class="shrink-0 font-medium text-gray-700">
                      {{ item.subtotal | cop }}
                    </span>
                  </li>
                }
              </ul>
              <div class="mt-2 space-y-0.5 border-t border-dashed border-cream-100 pt-2 text-[11px] text-gray-400">
                <div class="flex justify-between">
                  <span>Subtotal</span>
                  <span>{{ order.subtotal | cop }}</span>
                </div>
                @if (order.shippingCost > 0) {
                  <div class="flex justify-between">
                    <span>Domicilio</span>
                    <span>{{ order.shippingCost | cop }}</span>
                  </div>
                }
              </div>
            } @else {
              <p class="mt-3 border-t border-cream-100 pt-3 text-xs text-gray-400">
                Sin detalle de productos.
              </p>
            }

            @if (order.notes) {
              <p class="mt-2 line-clamp-2 text-[11px] italic text-gray-400">
                Nota: {{ order.notes }}
              </p>
            }

            <div class="mt-3 flex items-center justify-between border-t border-cream-100 pt-3">
              <p class="text-xs text-gray-400">
                {{ order.deliveryDate | dateCo }} · {{ order.deliveryTime | timeCo }}
              </p>
              <p class="text-base font-bold text-brand-500">{{ order.total | cop }}</p>
            </div>

            <div class="mt-4">
              <app-status-slider
                [status]="order.status"
                (advance)="advanceStatus(order, $event)"
              />
              @if (order.status !== 'delivered' && order.status !== 'cancelled') {
                <button
                  type="button"
                  (click)="cancelOrder(order)"
                  class="mt-2 w-full text-center text-[11px] font-medium text-gray-400 transition hover:text-red-500"
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

  readonly statusLabels = ORDER_STATUS_LABELS;
  readonly statusOptions = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];
  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly filter = signal<Filter>('all');

  private readonly badgeClasses: Record<OrderStatus, string> = {
    pending_payment: 'bg-amber-50 text-amber-700',
    payment_validated: 'bg-sky-50 text-sky-700',
    preparing: 'bg-violet-50 text-violet-700',
    on_the_way: 'bg-blue-50 text-blue-700',
    delivered: 'bg-emerald-50 text-emerald-700',
    cancelled: 'bg-gray-100 text-gray-500',
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
    return (
      'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ' +
      this.badgeClasses[status]
    );
  }

  async ngOnInit(): Promise<void> {
    await this.load();
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
