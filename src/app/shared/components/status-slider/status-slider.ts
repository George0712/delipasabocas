import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  OrderStatus,
} from '../../../core/models/order.model';

/**
 * Control "desliza para avanzar": el admin arrastra el botón de izquierda a
 * derecha para pasar el pedido al siguiente estado de forma secuencial.
 * No permite retroceder ni elegir estados arbitrarios.
 */
@Component({
  selector: 'app-status-slider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isTerminal()) {
      <div
        class="flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold"
        [class.bg-emerald-50]="status() === 'delivered'"
        [class.text-emerald-700]="status() === 'delivered'"
        [class.bg-gray-100]="status() === 'cancelled'"
        [class.text-gray-500]="status() === 'cancelled'"
      >
        @if (status() === 'delivered') {
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M20 6 9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Pedido entregado
        } @else {
          Pedido cancelado
        }
      </div>
    } @else if (nextStatus()) {
      <div
        #track
        class="relative h-11 w-full touch-none select-none overflow-hidden rounded-full border border-brand-100 bg-cream-100"
        (pointermove)="onPointerMove($event)"
        (pointerup)="onPointerUp()"
        (pointercancel)="onPointerUp()"
        (pointerleave)="onPointerUp()"
      >
        <div
          class="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-400 to-brand-500"
          [class.transition-all]="!dragging()"
          [style.width.px]="offset() + 40"
        ></div>

        <span
          class="pointer-events-none absolute inset-0 flex items-center justify-center pl-8 text-xs font-semibold text-brand-600"
          [style.opacity]="labelOpacity()"
        >
          Desliza para: {{ nextLabel() }}
        </span>

        <button
          type="button"
          class="absolute top-1 left-1 flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-600 shadow-md"
          [class.transition-transform]="!dragging()"
          [style.transform]="'translateX(' + offset() + 'px)'"
          (pointerdown)="onPointerDown($event)"
          aria-label="Deslizar para avanzar el estado"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    }
  `,
})
export class StatusSlider {
  readonly status = input.required<OrderStatus>();
  readonly disabled = input(false);
  readonly advance = output<OrderStatus>();

  private readonly track = viewChild<ElementRef<HTMLElement>>('track');
  private readonly thumb = 36;
  private readonly gap = 8;

  readonly offset = signal(0);
  readonly dragging = signal(false);

  private startX = 0;
  private maxX = 0;

  constructor() {
    effect(() => {
      this.status();
      this.offset.set(0);
      this.dragging.set(false);
    });
  }

  readonly nextStatus = computed<OrderStatus | null>(() => {
    const idx = ORDER_STATUS_FLOW.indexOf(this.status());
    if (idx === -1 || idx >= ORDER_STATUS_FLOW.length - 1) {
      return null;
    }
    return ORDER_STATUS_FLOW[idx + 1];
  });

  readonly isTerminal = computed(
    () => this.status() === 'delivered' || this.status() === 'cancelled',
  );

  readonly nextLabel = computed(() => {
    const next = this.nextStatus();
    return next ? ORDER_STATUS_LABELS[next] : '';
  });

  readonly labelOpacity = computed(() => {
    if (this.maxX <= 0) {
      return 1;
    }
    return Math.max(0, 1 - this.offset() / (this.maxX * 0.6));
  });

  onPointerDown(ev: PointerEvent): void {
    if (this.disabled() || !this.nextStatus()) {
      return;
    }
    const el = this.track()?.nativeElement;
    if (!el) {
      return;
    }
    this.maxX = el.clientWidth - this.thumb - this.gap;
    this.startX = ev.clientX - this.offset();
    this.dragging.set(true);
    (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
  }

  onPointerMove(ev: PointerEvent): void {
    if (!this.dragging()) {
      return;
    }
    const x = Math.max(0, Math.min(this.maxX, ev.clientX - this.startX));
    this.offset.set(x);
  }

  onPointerUp(): void {
    if (!this.dragging()) {
      return;
    }
    this.dragging.set(false);
    const next = this.nextStatus();
    if (next && this.maxX > 0 && this.offset() >= this.maxX * 0.85) {
      this.offset.set(this.maxX);
      this.advance.emit(next);
    } else {
      this.offset.set(0);
    }
  }
}
