import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  DashboardMetrics,
  Order,
  OrderStatus,
  ORDER_STATUS_LABELS,
} from '../../../core/models/order.model';
import { OrderService } from '../../../core/services/order.service';
import { CopPipe } from '../../../shared/pipes/cop.pipe';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CopPipe],
  template: `
    <div class="mb-5">
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p class="mt-0.5 text-sm text-gray-500">Resumen del negocio en tiempo real.</p>
    </div>

    @if (loading()) {
      <p class="text-sm text-gray-400">Cargando métricas...</p>
    } @else if (metrics(); as m) {
      <!-- KPIs principales -->
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div class="rounded-2xl border border-cream-200 bg-gradient-to-br from-brand-500 to-brand-600 p-4 text-white shadow-sm">
          <div class="flex items-center gap-2 text-brand-100">
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span class="text-xs font-medium uppercase tracking-wide">Ventas totales</span>
          </div>
          <p class="mt-2 text-xl font-bold sm:text-2xl">{{ m.revenue | cop }}</p>
          <p class="mt-1 text-xs text-brand-100">Este mes: {{ m.revenue_month | cop }}</p>
        </div>

        <div class="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
          <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Pedidos activos</p>
          <p class="mt-2 text-2xl font-bold text-gray-900">{{ m.active }}</p>
          <p class="mt-1 text-xs text-amber-600">{{ m.pending }} por pagar</p>
        </div>

        <div class="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
          <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Ticket promedio</p>
          <p class="mt-2 text-2xl font-bold text-gray-900">{{ m.avg_ticket | cop }}</p>
          <p class="mt-1 text-xs text-gray-400">{{ m.orders_total }} pedidos</p>
        </div>

        <div class="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
          <p class="text-xs font-medium uppercase tracking-wide text-gray-400">Clientes</p>
          <p class="mt-2 text-2xl font-bold text-gray-900">{{ m.customers }}</p>
          <p class="mt-1 text-xs text-emerald-600">{{ m.delivered }} entregados</p>
        </div>
      </div>

      <div class="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <!-- Gráfico de ventas 7 días -->
        <div class="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 class="mb-4 text-base font-semibold text-gray-800">Ventas últimos 7 días</h2>
          <div class="flex h-40 items-end justify-between gap-2">
            @for (point of m.sales_7d; track point.day) {
              <div class="flex flex-1 flex-col items-center gap-2">
                <div class="flex w-full flex-1 items-end">
                  <div
                    class="w-full rounded-t-md bg-gradient-to-t from-brand-300 to-brand-500 transition-all"
                    [style.height.%]="barHeight(point.total)"
                    [title]="point.total"
                    [style.min-height.px]="point.total > 0 ? 4 : 0"
                  ></div>
                </div>
                <span class="text-[10px] font-medium text-gray-400">{{ dayLabel(point.day) }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Top productos -->
        <div class="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
          <h2 class="mb-4 text-base font-semibold text-gray-800">Más vendidos</h2>
          @if (m.top_products.length === 0) {
            <p class="text-sm text-gray-400">Sin ventas aún.</p>
          } @else {
            <ul class="space-y-3">
              @for (tp of m.top_products; track tp.name) {
                <li>
                  <div class="mb-1 flex items-center justify-between gap-2">
                    <span class="truncate text-xs font-medium text-gray-600">{{ tp.name }}</span>
                    <span class="shrink-0 text-xs font-bold text-brand-500">{{ tp.qty }}</span>
                  </div>
                  <div class="h-2 w-full overflow-hidden rounded-full bg-cream-100">
                    <div
                      class="h-full rounded-full bg-accent-500"
                      [style.width.%]="topWidth(tp.qty)"
                    ></div>
                  </div>
                </li>
              }
            </ul>
          }
        </div>
      </div>

      <!-- Desglose por estado -->
      <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        @for (s of statusBreakdown(); track s.key) {
          <div class="rounded-xl border border-cream-200 bg-white p-3 text-center shadow-sm">
            <p class="text-xl font-bold text-gray-900">{{ s.value }}</p>
            <p class="mt-0.5 text-[11px] font-medium text-gray-400">{{ s.label }}</p>
          </div>
        }
      </div>

      <!-- Últimos pedidos -->
      <div class="mt-5 rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
        <h2 class="mb-4 text-base font-semibold text-gray-800">Últimos pedidos</h2>
        @if (orders().length === 0) {
          <p class="text-sm text-gray-400">Aún no hay pedidos registrados.</p>
        } @else {
          <ul class="divide-y divide-cream-100">
            @for (order of orders().slice(0, 6); track order.id) {
              <li class="flex items-center justify-between gap-3 py-3">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-gray-800">#{{ order.orderNumber }}</p>
                  <p class="truncate text-xs text-gray-500">{{ order.customerName }}</p>
                </div>
                <div class="flex shrink-0 items-center gap-3">
                  <span class="text-sm font-bold text-brand-500">{{ order.total | cop }}</span>
                  <span class="rounded-full bg-cream-100 px-2.5 py-1 text-[11px] font-medium text-brand-600">
                    {{ statusLabels[order.status] }}
                  </span>
                </div>
              </li>
            }
          </ul>
        }
      </div>
    } @else {
      <p class="text-sm text-gray-400">No se pudieron cargar las métricas.</p>
    }
  `,
})
export class Dashboard implements OnInit {
  private readonly orderService = inject(OrderService);

  readonly statusLabels = ORDER_STATUS_LABELS;
  readonly orders = signal<Order[]>([]);
  readonly metrics = signal<DashboardMetrics | null>(null);
  readonly loading = signal(true);

  private readonly maxSales = computed(() => {
    const m = this.metrics();
    if (!m) {
      return 1;
    }
    return Math.max(...m.sales_7d.map((s) => s.total), 1);
  });

  private readonly maxQty = computed(() => {
    const m = this.metrics();
    if (!m) {
      return 1;
    }
    return Math.max(...m.top_products.map((t) => t.qty), 1);
  });

  readonly statusBreakdown = computed<{ key: OrderStatus; label: string; value: number }[]>(() => {
    const m = this.metrics();
    if (!m) {
      return [];
    }
    return [
      { key: 'pending_payment', label: ORDER_STATUS_LABELS.pending_payment, value: m.pending },
      { key: 'payment_validated', label: ORDER_STATUS_LABELS.payment_validated, value: m.validated },
      { key: 'preparing', label: ORDER_STATUS_LABELS.preparing, value: m.preparing },
      { key: 'on_the_way', label: ORDER_STATUS_LABELS.on_the_way, value: m.on_the_way },
      { key: 'delivered', label: ORDER_STATUS_LABELS.delivered, value: m.delivered },
      { key: 'cancelled', label: ORDER_STATUS_LABELS.cancelled, value: m.cancelled },
    ];
  });

  barHeight(total: number): number {
    return Math.round((total / this.maxSales()) * 100);
  }

  topWidth(qty: number): number {
    return Math.round((qty / this.maxQty()) * 100);
  }

  dayLabel(day: string): string {
    const [y, m, d] = day.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date
      .toLocaleDateString('es-CO', { weekday: 'short' })
      .replace('.', '');
  }

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const [metrics, orders] = await Promise.all([
        this.orderService.getDashboardMetrics(),
        this.orderService.list(),
      ]);
      this.metrics.set(metrics);
      this.orders.set(orders);
    } catch (err) {
      console.error('No se pudieron cargar las métricas', err);
      this.metrics.set(null);
      this.orders.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
