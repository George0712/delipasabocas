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
    <div class="mb-6">
      <h1 class="adm-heading">Dashboard</h1>
      <p class="adm-subheading">Resumen del negocio en tiempo real.</p>
    </div>

    @if (loading()) {
      <p class="text-sm" [style.color]="'var(--adm-text-muted)'">Cargando métricas...</p>
    } @else if (metrics(); as m) {
      <div class="adm-stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div class="adm-card-kpi p-5">
          <div class="flex items-center gap-2 text-white/80">
            <span class="text-xs font-semibold uppercase tracking-wider">Ventas totales</span>
          </div>
          <p class="mt-3 text-2xl font-bold">{{ m.revenue | cop }}</p>
          <p class="mt-1 text-xs text-white/70">Este mes: {{ m.revenue_month | cop }}</p>
        </div>

        <div class="adm-card p-5">
          <p class="text-xs font-semibold uppercase tracking-wider" [style.color]="'var(--adm-text-muted)'">Pedidos activos</p>
          <p class="mt-3 text-2xl font-bold" [style.color]="'var(--adm-text)'">{{ m.active }}</p>
          <p class="mt-1 text-xs text-amber-500">{{ m.pending }} por pagar</p>
        </div>

        <div class="adm-card p-5">
          <p class="text-xs font-semibold uppercase tracking-wider" [style.color]="'var(--adm-text-muted)'">Ticket promedio</p>
          <p class="mt-3 text-2xl font-bold" [style.color]="'var(--adm-text)'">{{ m.avg_ticket | cop }}</p>
          <p class="mt-1 text-xs" [style.color]="'var(--adm-text-muted)'">{{ m.orders_total }} pedidos</p>
        </div>

        <div class="adm-card p-5">
          <p class="text-xs font-semibold uppercase tracking-wider" [style.color]="'var(--adm-text-muted)'">Clientes</p>
          <p class="mt-3 text-2xl font-bold" [style.color]="'var(--adm-text)'">{{ m.customers }}</p>
          <p class="mt-1 text-xs text-emerald-500">{{ m.delivered }} entregados</p>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div class="adm-card p-5 lg:col-span-2">
          <h2 class="text-base font-semibold" [style.color]="'var(--adm-text)'">Ventas últimos 7 días</h2>
          <div class="mt-5 flex h-44 items-end justify-between gap-2">
            @for (point of m.sales_7d; track point.day) {
              <div class="flex flex-1 flex-col items-center gap-2">
                <div class="flex w-full flex-1 items-end">
                  <div
                    class="adm-bar w-full"
                    [style.height.%]="barHeight(point.total)"
                    [title]="point.total"
                    [style.min-height.px]="point.total > 0 ? 4 : 0"
                  ></div>
                </div>
                <span class="text-[10px] font-medium capitalize" [style.color]="'var(--adm-text-muted)'">{{ dayLabel(point.day) }}</span>
              </div>
            }
          </div>
        </div>

        <div class="adm-card p-5">
          <h2 class="text-base font-semibold" [style.color]="'var(--adm-text)'">Más vendidos</h2>
          @if (m.top_products.length === 0) {
            <p class="mt-4 text-sm" [style.color]="'var(--adm-text-muted)'">Sin ventas aún.</p>
          } @else {
            <ul class="mt-4 space-y-4">
              @for (tp of m.top_products; track tp.name) {
                <li>
                  <div class="mb-1.5 flex items-center justify-between gap-2">
                    <span class="truncate text-xs font-medium" [style.color]="'var(--adm-text-secondary)'">{{ tp.name }}</span>
                    <span class="shrink-0 text-xs font-bold text-[var(--adm-primary)]">{{ tp.qty }}</span>
                  </div>
                  <div class="h-1.5 w-full overflow-hidden rounded-full" [style.background]="'var(--adm-bg-subtle)'">
                    <div
                      class="h-full rounded-full bg-[var(--adm-primary)] transition-all duration-500"
                      [style.width.%]="topWidth(tp.qty)"
                    ></div>
                  </div>
                </li>
              }
            </ul>
          }
        </div>
      </div>

      <div class="adm-stagger mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        @for (s of statusBreakdown(); track s.key) {
          <div class="adm-card p-3 text-center">
            <p class="text-xl font-bold" [style.color]="'var(--adm-text)'">{{ s.value }}</p>
            <p class="mt-0.5 text-[11px] font-medium" [style.color]="'var(--adm-text-muted)'">{{ s.label }}</p>
          </div>
        }
      </div>

      <div class="adm-card mt-6 p-5">
        <h2 class="text-base font-semibold" [style.color]="'var(--adm-text)'">Últimos pedidos</h2>
        @if (orders().length === 0) {
          <p class="mt-4 text-sm" [style.color]="'var(--adm-text-muted)'">Aún no hay pedidos registrados.</p>
        } @else {
          <ul class="mt-4 divide-y adm-divider">
            @for (order of orders().slice(0, 6); track order.id) {
              <li class="flex items-center justify-between gap-3 py-3">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold" [style.color]="'var(--adm-text)'">#{{ order.orderNumber }}</p>
                  <p class="truncate text-xs" [style.color]="'var(--adm-text-muted)'">{{ order.customerName }}</p>
                </div>
                <div class="flex shrink-0 items-center gap-3">
                  <span class="text-sm font-bold text-[var(--adm-primary)]">{{ order.total | cop }}</span>
                  <span class="rounded-full px-2.5 py-1 text-[11px] font-medium" [style.background]="'var(--adm-bg-subtle)'" [style.color]="'var(--adm-primary)'">
                    {{ statusLabels[order.status] }}
                  </span>
                </div>
              </li>
            }
          </ul>
        }
      </div>
    } @else {
      <p class="text-sm" [style.color]="'var(--adm-text-muted)'">No se pudieron cargar las métricas.</p>
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
