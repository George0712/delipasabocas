import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  OrderStatus,
  OrderTracking,
} from '../../core/models/order.model';
import { OrderLiveService } from '../../core/services/order-live.service';
import { OrderService } from '../../core/services/order.service';
import { CopPipe } from '../../shared/pipes/cop.pipe';
import { DateCoPipe } from '../../shared/pipes/date-co.pipe';
import { TimeCoPipe } from '../../shared/pipes/time-co.pipe';
import { formatDateTimeCo } from '../../shared/utils/format';
import { WhatsappButton } from '../../shared/components/whatsapp-button/whatsapp-button';
import { whatsappTrackingMessage } from '../../shared/utils/whatsapp-messages';

interface Step {
  status: OrderStatus;
  label: string;
  reached: boolean;
  current: boolean;
  timestamp: string | null;
}

@Component({
  selector: 'app-tracking',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CopPipe, DateCoPipe, TimeCoPipe, RouterLink, WhatsappButton],
  template: `
    <div class="app-shell app-page">
    <header class="flex items-center px-4 pt-5">
      <a routerLink="/" aria-label="Volver al inicio" class="flex items-center gap-2.5 text-[var(--app-primary)] transition active:scale-95">
        <svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
          <path d="M9.5 21v-6h5v6" />
        </svg>
        <span class="font-brand text-2xl">DeliPasabocas</span>
      </a>
    </header>

    <main class="mx-auto max-w-md px-4 pb-16 pt-4">
      <h1 class="app-heading mb-1">Seguimiento de pedido</h1>
      <p class="app-subheading mb-5">Consulta el estado de tu pedido con su número.</p>

      <form (submit)="$event.preventDefault(); search()" class="mb-6 flex gap-2">
        <div class="flex flex-1 items-center rounded-xl border px-3" [style.border-color]="'var(--app-border)'" [style.background]="'var(--app-surface)'">
          <span class="app-text-muted text-sm">#</span>
          <input [value]="query()" (input)="onInput($event)" placeholder="DPB-000123" class="w-full bg-transparent px-1 py-2.5 text-sm uppercase focus:outline-none" />
        </div>
        <button type="submit" class="shrink-0 rounded-xl px-4 text-sm font-semibold text-white transition hover:opacity-90" [style.background]="'var(--app-primary)'">Buscar</button>
      </form>

      @if (loading()) {
        <div class="space-y-3">
          <div class="app-skeleton h-24"></div>
          <div class="app-skeleton h-64"></div>
        </div>
      } @else if (loadError()) {
        <div class="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p class="text-sm text-red-600">Ocurrió un error al consultar el pedido. Revisa tu conexión e inténtalo de nuevo.</p>
        </div>
      } @else if (notFound()) {
        <div class="app-card p-6 text-center">
          <p class="app-text-secondary text-sm">
            No encontramos un pedido con el número <span class="app-text font-semibold">#{{ query() }}</span>. Verifica e inténtalo de nuevo.
          </p>
        </div>
      } @else if (tracking(); as t) {
        <div class="app-card p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="app-eyebrow">Pedido</p>
              <p class="app-text-primary text-lg font-extrabold">#{{ t.orderNumber }}</p>
            </div>
            <span class="rounded-full px-3 py-1 text-xs font-semibold" [class.bg-red-100]="t.status === 'cancelled'" [class.text-red-600]="t.status === 'cancelled'" [style.background]="t.status !== 'cancelled' ? 'var(--app-bg-subtle)' : null" [class.app-text-primary]="t.status !== 'cancelled'">
              {{ statusLabels[t.status] }}
            </span>
          </div>

          <dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><dt class="app-text-muted text-xs">Cliente</dt><dd class="app-text font-medium">{{ t.customerName }}</dd></div>
            <div><dt class="app-text-muted text-xs">Total</dt><dd class="app-text font-medium">{{ t.total | cop }}</dd></div>
            <div><dt class="app-text-muted text-xs">Entrega</dt><dd class="app-text font-medium">{{ t.deliveryDate | dateCo }}</dd></div>
            <div><dt class="app-text-muted text-xs">Hora</dt><dd class="app-text font-medium">{{ t.deliveryTime | timeCo }}</dd></div>
            <div class="col-span-2"><dt class="app-text-muted text-xs">Dirección de entrega</dt><dd class="app-text font-medium leading-snug">{{ t.address }}</dd></div>
          </dl>

          @if (t.items.length > 0) {
            <div class="app-divider mt-4 border-t pt-4">
              <p class="app-eyebrow mb-2">Tu pedido</p>
              <ul class="space-y-2">
                @for (item of t.items; track $index) {
                  <li class="flex items-start justify-between gap-2 text-sm">
                    <span class="app-text-secondary min-w-0 flex-1 leading-snug"><span class="app-text font-semibold">{{ item.quantity }}×</span> {{ item.productName }}</span>
                    <span class="app-text shrink-0 font-medium">{{ item.subtotal | cop }}</span>
                  </li>
                }
              </ul>
              @if (t.shippingCost > 0) {
                <div class="app-divider mt-2 flex justify-between border-t border-dashed pt-2 text-xs app-text-muted">
                  <span>Domicilio</span><span>{{ t.shippingCost | cop }}</span>
                </div>
              }
            </div>
          }
        </div>

        @if (t.status === 'cancelled') {
          <div class="mt-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-600">
            Este pedido fue cancelado. Si crees que es un error, contáctanos por WhatsApp.
          </div>
        } @else {
          <ol class="mt-5">
            @for (step of steps(); track step.status; let last = $last) {
              <li class="relative flex gap-4 pb-7 last:pb-0">
                @if (!last) {
                  <span class="absolute left-4 top-8 bottom-0 w-0.5 -translate-x-1/2" [style.background]="step.reached ? 'var(--app-primary)' : 'var(--app-border)'"></span>
                }
                <span
                  class="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-xs font-bold transition"
                  [style.border-color]="step.reached ? 'var(--app-primary)' : 'var(--app-border)'"
                  [style.background]="step.reached ? 'var(--app-primary)' : 'var(--app-surface)'"
                  [class.text-white]="step.reached"
                  [class.app-text-muted]="!step.reached"
                >
                  @if (step.reached) { ✓ } @else { {{ $index + 1 }} }
                </span>
                <div class="pt-1">
                  <p class="text-sm font-semibold leading-tight" [class.app-text]="step.reached || step.current" [class.app-text-muted]="!step.reached">{{ step.label }}</p>
                  @if (step.timestamp) {
                    <p class="app-text-muted mt-0.5 text-xs">{{ step.timestamp }}</p>
                  }
                  @if (step.current) {
                    <span class="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium" [style.background]="'var(--app-bg-subtle)'" [class.app-text-primary]="true">Estado actual</span>
                  }
                </div>
              </li>
            }
          </ol>
        }
      } @else {
        <div class="app-card border-dashed p-6 text-center app-text-muted text-sm">
          Ingresa el número de tu pedido para ver su estado.
        </div>
      }
    </main>

    <div class="fixed bottom-5 right-4 z-30">
      <app-whatsapp-button
        label="Escríbenos"
        [message]="whatsappMessage()"
      />
    </div>
    </div>
  `,
})
export class Tracking {
  private readonly orderService = inject(OrderService);
  private readonly orderLive = inject(OrderLiveService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private stopPolling: (() => void) | null = null;

  /** Bind al parámetro de ruta :orderNumber (withComponentInputBinding). */
  readonly orderNumber = input<string>('');

  readonly query = signal('');
  readonly tracking = signal<OrderTracking | null>(null);
  readonly loading = signal(false);
  readonly notFound = signal(false);
  readonly loadError = signal(false);

  readonly statusLabels = ORDER_STATUS_LABELS;

  readonly steps = computed<Step[]>(() => {
    const t = this.tracking();
    if (!t) {
      return [];
    }
    const currentIndex = ORDER_STATUS_FLOW.indexOf(t.status);
    return ORDER_STATUS_FLOW.map((status, index) => ({
      status,
      label: ORDER_STATUS_LABELS[status],
      reached: index <= currentIndex,
      current: index === currentIndex,
      timestamp: this.timestampFor(t, status),
    }));
  });

  readonly whatsappMessage = computed(() =>
    whatsappTrackingMessage(
      this.tracking()?.orderNumber ??
        (this.query().trim() || this.orderNumber()),
    ),
  );

  constructor() {
    effect(() => {
      const number = this.orderNumber();
      if (number) {
        this.query.set(number);
        void this.load(number);
      }
    });

    effect(() => {
      const activeNumber =
        this.tracking()?.orderNumber ??
        (this.query().trim().toUpperCase() ||
          this.orderNumber().trim().toUpperCase());

      this.stopPolling?.();
      this.stopPolling = null;

      if (!this.tracking() || !activeNumber) {
        return;
      }

      this.stopPolling = this.orderLive.watchOrderTracking(activeNumber, () => {
        void this.refresh(activeNumber);
      });
    });

    this.destroyRef.onDestroy(() => this.stopPolling?.());
  }

  onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  search(): void {
    const number = this.query().trim().toUpperCase();
    if (number) {
      this.router.navigate(['/seguimiento', number]);
    }
  }

  private async refresh(orderNumber: string): Promise<void> {
    try {
      const result = await this.orderService.getStatusByNumber(orderNumber);
      if (result) {
        this.tracking.set(result);
        this.notFound.set(false);
        this.loadError.set(false);
      }
    } catch {
      /* Ignora fallos puntuales del polling en segundo plano. */
    }
  }

  private async load(orderNumber: string): Promise<void> {
    this.loading.set(true);
    this.notFound.set(false);
    this.loadError.set(false);
    try {
      const result = await this.orderService.getStatusByNumber(orderNumber);
      this.tracking.set(result);
      this.notFound.set(result === null);
    } catch (err) {
      this.tracking.set(null);
      this.loadError.set(true);
      console.error('Error consultando el pedido', err);
    } finally {
      this.loading.set(false);
    }
  }

  private timestampFor(t: OrderTracking, status: OrderStatus): string | null {
    const entry = t.history.find((h) => h.status === status);
    const iso =
      entry?.created_at ??
      (status === 'pending_payment' ? t.createdAt : null);
    if (!iso) {
      return null;
    }
    return formatDateTimeCo(iso);
  }
}
