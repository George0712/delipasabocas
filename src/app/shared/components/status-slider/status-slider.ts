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
        class="adm-slider-terminal"
        [class.adm-slider-terminal-success]="status() === 'delivered'"
        [class.adm-slider-terminal-muted]="status() === 'cancelled'"
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
        class="adm-slider-track relative h-12 w-full touch-none select-none overflow-hidden rounded-full"
        [class.adm-slider-dragging]="dragging()"
        (pointermove)="onPointerMove($event)"
        (pointerup)="onPointerUp()"
        (pointercancel)="onPointerUp()"
        (pointerleave)="onPointerUp()"
      >
        <div
          class="adm-slider-fill absolute inset-y-0 left-0 z-[1] overflow-hidden rounded-full"
          [class.transition-all]="!dragging()"
          [class.duration-300]="!dragging()"
          [style.width.px]="fillEnd()"
        >
          @if (dragging()) {
            <div class="adm-slider-fill-pulse" aria-hidden="true"></div>
            <div
              class="adm-slider-fill-cues"
              [style.opacity]="cuesOpacity()"
              aria-hidden="true"
            >
              <div class="adm-slider-cues">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 8l4 4-4 4" />
                </svg>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 8l4 4-4 4" />
                </svg>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 8l4 4-4 4" />
                </svg>
              </div>
            </div>
          }
        </div>

        <span
          class="adm-slider-label pointer-events-none absolute inset-y-0 z-[1] flex items-center truncate pr-4"
          [style.left.px]="fillEnd() + 12"
        >
          Pasar a {{ nextLabel() }}
        </span>

        <button
          type="button"
          class="absolute top-1 left-1 bottom-1 right-1 z-[2] box-border flex h-10 w-10 items-center justify-center rounded-full"
          [class.transition-transform]="!dragging()"
          [class.duration-300]="!dragging()"
          [style.transform]="'translateX(' + offset() + 'px)'"
          (pointerdown)="onPointerDown($event)"
          aria-label="Deslizar para avanzar el estado"
        >
          <span class="adm-slider-thumb flex size-full items-center justify-center rounded-full">
            <svg
              viewBox="0 0 24 24"
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              stroke-width="2.25"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M8 8l4 4-4 4" />
              <path d="M13 8l4 4-4 4" />
            </svg>
          </span>
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
  /** Tamaño exterior del botón deslizable (h-10 / w-10). */
  readonly thumbSize = 40;
  /** Margen del botón respecto al borde de la pista (top-1 / left-1). */
  readonly trackPadding = 4;

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

  readonly thumbEnd = computed(() => this.offset() + this.thumbSize + this.trackPadding * 2);

  readonly fillEnd = computed(() => this.thumbEnd());

  /** Aparece gradualmente cuando el centro del relleno sale del thumb. */
  readonly cuesOpacity = computed(() => {
    if (!this.dragging()) {
      return 0;
    }
    const center = this.thumbEnd() / 2;
    const thumbStart = this.offset() + this.trackPadding;
    const thumbEndPos = thumbStart + this.thumbSize;
    if (center <= thumbStart || center >= thumbEndPos) {
      return 1;
    }
    const depth = center - thumbStart;
    const fadeZone = this.thumbSize * 0.55;
    return Math.max(0, 1 - depth / fadeZone);
  });

  onPointerDown(ev: PointerEvent): void {
    if (this.disabled() || !this.nextStatus()) {
      return;
    }
    const el = this.track()?.nativeElement;
    if (!el) {
      return;
    }
    this.maxX = el.clientWidth - this.thumbSize - this.trackPadding * 2;
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
