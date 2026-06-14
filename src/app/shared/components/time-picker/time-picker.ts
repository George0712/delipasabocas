import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

interface ClockNumber {
  label: string;
  value: number;
  x: number;
  y: number;
  disabled: boolean;
  selected: boolean;
}

@Component({
  selector: 'app-time-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimePicker),
      multi: true,
    },
  ],
  template: `
    <button
      type="button"
      (click)="toggle()"
      [disabled]="disabled()"
      class="flex w-full items-center justify-between rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-left text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-50"
    >
      <span [class.text-gray-400]="!value()">
        {{ value() ? displayTime() : 'Selecciona la hora' }}
      </span>
      <svg viewBox="0 0 24 24" class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="9" />
        <path stroke-linecap="round" d="M12 7v5l3 2" />
      </svg>
    </button>

    @if (open()) {
      <div class="fixed inset-0 z-40 bg-black/20" (click)="cancel()"></div>
      <div
        class="fixed left-1/2 top-1/2 z-50 w-[19rem] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-cream-200 bg-white p-5 shadow-2xl"
      >
        <!-- Lectura digital -->
        <div class="mb-4 flex items-center justify-center gap-2">
          <button
            type="button"
            (click)="mode.set('hours')"
            class="rounded-lg px-2 py-1 text-3xl font-bold tabular-nums"
            [class.text-brand-500]="mode() === 'hours'"
            [class.text-gray-400]="mode() !== 'hours'"
          >
            {{ hour12String() }}
          </button>
          <span class="text-3xl font-bold text-gray-400">:</span>
          <button
            type="button"
            (click)="mode.set('minutes')"
            class="rounded-lg px-2 py-1 text-3xl font-bold tabular-nums"
            [class.text-brand-500]="mode() === 'minutes'"
            [class.text-gray-400]="mode() !== 'minutes'"
          >
            {{ minuteString() }}
          </button>
          <div class="ml-2 flex flex-col gap-1">
            <button
              type="button"
              (click)="setPeriod('AM')"
              class="rounded-md px-2 py-0.5 text-xs font-semibold"
              [class.bg-brand-500]="period() === 'AM'"
              [class.text-white]="period() === 'AM'"
              [class.text-gray-500]="period() !== 'AM'"
            >
              AM
            </button>
            <button
              type="button"
              (click)="setPeriod('PM')"
              class="rounded-md px-2 py-0.5 text-xs font-semibold"
              [class.bg-brand-500]="period() === 'PM'"
              [class.text-white]="period() === 'PM'"
              [class.text-gray-500]="period() !== 'PM'"
            >
              PM
            </button>
          </div>
        </div>

        <!-- Esfera del reloj -->
        <div class="relative mx-auto h-56 w-56 rounded-full bg-cream-100">
          <span
            class="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500"
          ></span>
          @if (selectedAngle() !== null) {
            <span
              class="absolute bottom-1/2 left-1/2 w-0.5 origin-bottom -translate-x-1/2 bg-brand-500"
              [style.height.px]="80"
              [style.transform]="'translateX(-50%) rotate(' + selectedAngle() + 'deg)'"
            ></span>
          }
          @for (n of clockNumbers(); track n.label) {
            <button
              type="button"
              [disabled]="n.disabled"
              (click)="pickNumber(n.value)"
              class="absolute grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-sm transition"
              [style.left.px]="n.x"
              [style.top.px]="n.y"
              [class.bg-brand-500]="n.selected"
              [class.text-white]="n.selected"
              [class.text-gray-700]="!n.selected && !n.disabled"
              [class.opacity-25]="n.disabled"
            >
              {{ n.label }}
            </button>
          }
        </div>

        <div class="mt-4 flex justify-end gap-2">
          <button
            type="button"
            (click)="cancel()"
            class="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-cream-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            (click)="confirm()"
            class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Listo
          </button>
        </div>
      </div>
    }
  `,
})
export class TimePicker implements ControlValueAccessor {
  /** Fecha seleccionada (YYYY-MM-DD) para bloquear horas pasadas si es hoy. */
  readonly minDate = input<string>('');

  readonly value = signal<string>('');
  readonly disabled = signal(false);
  readonly open = signal(false);
  readonly mode = signal<'hours' | 'minutes'>('hours');

  readonly hour24 = signal(12);
  readonly minute = signal(0);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  readonly period = computed<'AM' | 'PM'>(() =>
    this.hour24() >= 12 ? 'PM' : 'AM',
  );

  private readonly nowMinutes = computed(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  private readonly isToday = computed(() => {
    const d = this.minDate();
    if (!d) {
      return false;
    }
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return d === todayIso;
  });

  hour12String(): string {
    const h = this.hour24() % 12;
    return String(h === 0 ? 12 : h).padStart(2, '0');
  }

  minuteString(): string {
    return String(this.minute()).padStart(2, '0');
  }

  displayTime(): string {
    return `${this.hour12String()}:${this.minuteString()} ${this.period()}`;
  }

  readonly selectedAngle = computed<number | null>(() => {
    if (this.mode() === 'hours') {
      const h = this.hour24() % 12;
      return h * 30;
    }
    return this.minute() * 6;
  });

  readonly clockNumbers = computed<ClockNumber[]>(() => {
    const radius = 92;
    const center = 112;
    const isHours = this.mode() === 'hours';
    const count = 12;

    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);

      if (isHours) {
        const h12 = i === 0 ? 12 : i;
        const h24 = this.to24(h12, this.period());
        return {
          label: String(h12),
          value: h12,
          x,
          y,
          disabled: this.isHourDisabled(h24),
          selected: this.hour24() % 12 === i,
        };
      }

      const minute = i * 5;
      return {
        label: String(minute).padStart(2, '0'),
        value: minute,
        x,
        y,
        disabled: this.isMinuteDisabled(minute),
        selected: this.minute() === minute,
      };
    });
  });

  private to24(h12: number, period: 'AM' | 'PM'): number {
    if (period === 'AM') {
      return h12 === 12 ? 0 : h12;
    }
    return h12 === 12 ? 12 : h12 + 12;
  }

  private isHourDisabled(h24: number): boolean {
    if (!this.isToday()) {
      return false;
    }
    return h24 * 60 + 59 < this.nowMinutes();
  }

  private isMinuteDisabled(minute: number): boolean {
    if (!this.isToday()) {
      return false;
    }
    return this.hour24() * 60 + minute < this.nowMinutes();
  }

  toggle(): void {
    if (this.disabled()) {
      return;
    }
    if (!this.open()) {
      this.mode.set('hours');
    }
    this.open.update((v) => !v);
    this.onTouched();
  }

  setPeriod(period: 'AM' | 'PM'): void {
    const h12 = this.hour24() % 12 === 0 ? 12 : this.hour24() % 12;
    this.hour24.set(this.to24(h12, period));
  }

  pickNumber(value: number): void {
    if (this.mode() === 'hours') {
      this.hour24.set(this.to24(value, this.period()));
      this.mode.set('minutes');
    } else {
      this.minute.set(value);
    }
  }

  confirm(): void {
    const v = `${String(this.hour24()).padStart(2, '0')}:${this.minuteString()}`;
    this.value.set(v);
    this.onChange(v);
    this.open.set(false);
  }

  cancel(): void {
    this.open.set(false);
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
    if (value) {
      const [h, m] = value.split(':').map(Number);
      this.hour24.set(h);
      this.minute.set(m);
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
