import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
    <header class="flex items-center px-4 pt-5">
      <a
        routerLink="/"
        aria-label="Volver al inicio"
        class="flex items-center gap-2.5 text-accent-600 transition active:scale-95"
      >
        <svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
          <path d="M9.5 21v-6h5v6" />
        </svg>
        <span class="font-brand text-2xl">DeliPasabocas</span>
      </a>
    </header>

    <main class="mx-auto max-w-md px-4 pb-16 pt-4">
      <h1 class="mb-1 text-xl font-bold text-gray-900">Seguimiento de pedido</h1>
      <p class="mb-5 text-sm text-gray-500">
        Consulta el estado de tu pedido con su número.
      </p>

      <form (submit)="$event.preventDefault(); search()" class="mb-6 flex gap-2">
        <div
          class="flex flex-1 items-center rounded-xl border border-cream-200 bg-white px-3"
        >
          <span class="text-sm text-gray-400">#</span>
          <input
            [value]="query()"
            (input)="onInput($event)"
            placeholder="DPB-000123"
            class="w-full bg-transparent px-1 py-2.5 text-sm uppercase focus:outline-none"
          />
        </div>
        <button
          type="submit"
          class="rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          Buscar
        </button>
      </form>

      @if (loading()) {
        <div class="space-y-3">
          <div class="h-24 animate-pulse rounded-2xl bg-cream-200"></div>
          <div class="h-64 animate-pulse rounded-2xl bg-cream-200"></div>
        </div>
      } @else if (loadError()) {
        <div
          class="rounded-2xl border border-red-100 bg-red-50 p-6 text-center"
        >
          <p class="text-sm text-red-600">
            Ocurrió un error al consultar el pedido. Revisa tu conexión e
            inténtalo de nuevo.
          </p>
        </div>
      } @else if (notFound()) {
        <div
          class="rounded-2xl border border-cream-200 bg-white p-6 text-center"
        >
          <p class="text-sm text-gray-600">
            No encontramos un pedido con el número
            <span class="font-semibold">#{{ query() }}</span>. Verifica e
            inténtalo de nuevo.
          </p>
        </div>
      } @else if (tracking(); as t) {
        <div class="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs uppercase tracking-wide text-gray-400">Pedido</p>
              <p class="text-lg font-extrabold text-brand-500">
                #{{ t.orderNumber }}
              </p>
            </div>
            <span
              class="rounded-full px-3 py-1 text-xs font-semibold"
              [class.bg-red-100]="t.status === 'cancelled'"
              [class.text-red-600]="t.status === 'cancelled'"
              [class.bg-brand-50]="t.status !== 'cancelled'"
              [class.text-brand-600]="t.status !== 'cancelled'"
            >
              {{ statusLabels[t.status] }}
            </span>
          </div>

          <dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt class="text-xs text-gray-400">Cliente</dt>
              <dd class="font-medium text-gray-800">{{ t.customerName }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-400">Total</dt>
              <dd class="font-medium text-gray-800">{{ t.total | cop }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-400">Entrega</dt>
              <dd class="font-medium text-gray-800">
                {{ t.deliveryDate | dateCo }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-gray-400">Hora</dt>
              <dd class="font-medium text-gray-800">
                {{ t.deliveryTime | timeCo }}
              </dd>
            </div>
          </dl>
        </div>

        @if (t.status === 'cancelled') {
          <div
            class="mt-4 rounded-2xl border border-red-100 bg-red-50 p-5 text-center text-sm text-red-600"
          >
            Este pedido fue cancelado. Si crees que es un error, contáctanos por
            WhatsApp.
          </div>
        } @else {
          <ol class="mt-5">
            @for (step of steps(); track step.status; let last = $last) {
              <li class="relative flex gap-4 pb-7 last:pb-0">
                @if (!last) {
                  <span
                    class="absolute left-4 top-8 bottom-0 w-0.5 -translate-x-1/2"
                    [class.bg-brand-500]="step.reached"
                    [class.bg-cream-200]="!step.reached"
                  ></span>
                }
                <span
                  class="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-xs font-bold transition"
                  [class.border-brand-500]="step.reached"
                  [class.bg-brand-500]="step.reached"
                  [class.text-white]="step.reached"
                  [class.border-cream-200]="!step.reached"
                  [class.bg-white]="!step.reached"
                  [class.text-gray-300]="!step.reached"
                >
                  @if (step.reached) {
                    ✓
                  } @else {
                    {{ $index + 1 }}
                  }
                </span>
                <div class="pt-1">
                  <p
                    class="text-sm font-semibold leading-tight"
                    [class.text-gray-900]="step.reached || step.current"
                    [class.text-gray-400]="!step.reached"
                  >
                    {{ step.label }}
                  </p>
                  @if (step.timestamp) {
                    <p class="mt-0.5 text-xs text-gray-400">{{ step.timestamp }}</p>
                  }
                  @if (step.current) {
                    <span
                      class="mt-1 inline-block rounded-full bg-accent-400/20 px-2 py-0.5 text-xs font-medium text-accent-600"
                    >
                      Estado actual
                    </span>
                  }
                </div>
              </li>
            }
          </ol>
        }
      } @else {
        <div
          class="rounded-2xl border border-dashed border-cream-200 bg-white/60 p-6 text-center text-sm text-gray-400"
        >
          Ingresa el número de tu pedido para ver su estado.
        </div>
      }
    </main>

    <!-- Botón de contacto siempre visible -->
    <div class="fixed bottom-5 right-4 z-30">
      <app-whatsapp-button
        label="Escríbenos"
        [message]="whatsappMessage()"
      />
    </div>
  `,
})
export class Tracking {
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);

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
