import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { formatDateCo } from '../../utils/format';

interface DayCell {
  day: number;
  iso: string;
  disabled: boolean;
  isToday: boolean;
}

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

@Component({
  selector: 'app-date-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePicker),
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
        {{ value() ? displayDate() : 'Selecciona la fecha' }}
      </span>
      <svg viewBox="0 0 24 24" class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path stroke-linecap="round" d="M3 9h18M8 2v4M16 2v4" />
      </svg>
    </button>

    @if (open()) {
      <div class="fixed inset-0 z-40" (click)="close()"></div>
      <div
        class="absolute z-50 mt-2 w-72 rounded-2xl border border-cream-200 bg-white p-4 shadow-xl"
      >
        <div class="mb-3 flex items-center justify-between">
          <button
            type="button"
            (click)="prevMonth()"
            class="grid h-8 w-8 place-items-center rounded-full text-gray-500 hover:bg-cream-100"
            aria-label="Mes anterior"
          >
            ‹
          </button>
          <span class="text-sm font-semibold capitalize text-gray-800">
            {{ monthName() }} {{ viewYear() }}
          </span>
          <button
            type="button"
            (click)="nextMonth()"
            class="grid h-8 w-8 place-items-center rounded-full text-gray-500 hover:bg-cream-100"
            aria-label="Mes siguiente"
          >
            ›
          </button>
        </div>

        <div class="mb-1 grid grid-cols-7 text-center text-xs font-medium text-gray-400">
          @for (wd of weekdays; track wd) {
            <span>{{ wd }}</span>
          }
        </div>

        <div class="grid grid-cols-7 gap-1">
          @for (blank of leadingBlanks(); track $index) {
            <span></span>
          }
          @for (cell of days(); track cell.iso) {
            <button
              type="button"
              [disabled]="cell.disabled"
              (click)="pick(cell)"
              class="grid h-9 w-9 place-items-center rounded-full text-sm transition"
              [class.bg-brand-500]="cell.iso === value()"
              [class.text-white]="cell.iso === value()"
              [class.font-bold]="cell.isToday"
              [class.text-brand-500]="cell.isToday && cell.iso !== value()"
              [class.text-gray-700]="!cell.isToday && cell.iso !== value()"
              [class.opacity-30]="cell.disabled"
              [class.hover:bg-cream-100]="!cell.disabled && cell.iso !== value()"
            >
              {{ cell.day }}
            </button>
          }
        </div>
      </div>
    }
  `,
})
export class DatePicker implements ControlValueAccessor {
  readonly value = signal<string>('');
  readonly disabled = signal(false);
  readonly open = signal(false);

  readonly weekdays = WEEKDAYS;

  private readonly today = this.startOfToday();
  readonly viewYear = signal(this.today.getFullYear());
  readonly viewMonth = signal(this.today.getMonth());

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  displayDate(): string {
    return formatDateCo(this.value());
  }

  monthName(): string {
    return MONTHS[this.viewMonth()];
  }

  leadingBlanks(): number[] {
    const first = new Date(this.viewYear(), this.viewMonth(), 1).getDay();
    // getDay: 0=domingo. Queremos semana iniciando en lunes.
    const offset = (first + 6) % 7;
    return Array.from({ length: offset });
  }

  days(): DayCell[] {
    const year = this.viewYear();
    const month = this.viewMonth();
    const total = new Date(year, month + 1, 0).getDate();
    const todayIso = this.toIso(this.today);

    return Array.from({ length: total }, (_, i) => {
      const day = i + 1;
      const date = new Date(year, month, day);
      const iso = this.toIso(date);
      return {
        day,
        iso,
        disabled: date < this.today,
        isToday: iso === todayIso,
      };
    });
  }

  toggle(): void {
    if (this.disabled()) {
      return;
    }
    this.open.update((v) => !v);
    this.onTouched();
  }

  close(): void {
    this.open.set(false);
  }

  prevMonth(): void {
    const m = this.viewMonth();
    if (m === 0) {
      this.viewMonth.set(11);
      this.viewYear.update((y) => y - 1);
    } else {
      this.viewMonth.set(m - 1);
    }
  }

  nextMonth(): void {
    const m = this.viewMonth();
    if (m === 11) {
      this.viewMonth.set(0);
      this.viewYear.update((y) => y + 1);
    } else {
      this.viewMonth.set(m + 1);
    }
  }

  pick(cell: DayCell): void {
    if (cell.disabled) {
      return;
    }
    this.value.set(cell.iso);
    this.onChange(cell.iso);
    this.close();
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
    if (value) {
      const [y, m] = value.split('-').map(Number);
      this.viewYear.set(y);
      this.viewMonth.set(m - 1);
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

  private startOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private toIso(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
