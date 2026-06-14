import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { fromEvent } from 'rxjs';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Select personalizado: menú anclado justo debajo del input (position absolute).
 * Evita el menú nativo y no usa fixed, que falla dentro de modales con transform.
 */
@Component({
  selector: 'app-custom-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelect),
      multi: true,
    },
  ],
  template: `
    <div class="relative" [class.z-20]="open()">
      <button
        type="button"
        (click)="toggle()"
        [disabled]="disabled()"
        class="flex w-full items-center justify-between gap-2 rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-left text-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-50"
        [class.border-brand-400]="open()"
        [class.ring-2]="open()"
        [class.ring-brand-100]="open()"
      >
        <span [class.text-gray-400]="!selectedLabel()">
          {{ selectedLabel() ?? placeholder() }}
        </span>
        <svg
          viewBox="0 0 24 24"
          class="h-4 w-4 shrink-0 text-gray-400 transition"
          [class.rotate-180]="open()"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      @if (open()) {
        <ul
          class="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-xl border border-cream-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          @for (option of options(); track option.value) {
            <li>
              <button
                type="button"
                role="option"
                [attr.aria-selected]="value() === option.value"
                [disabled]="option.disabled"
                (click)="pick(option)"
                class="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition disabled:opacity-40"
                [class.bg-brand-50]="value() === option.value"
                [class.text-brand-600]="value() === option.value"
                [class.font-semibold]="value() === option.value"
                [class.text-gray-700]="value() !== option.value"
                [class.hover:bg-cream-50]="value() !== option.value"
              >
                <span>{{ option.label }}</span>
                @if (value() === option.value) {
                  <svg viewBox="0 0 24 24" class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M20 6 9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                }
              </button>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class CustomSelect implements ControlValueAccessor {
  private readonly destroyRef = inject(DestroyRef);

  readonly options = input.required<SelectOption[]>();
  readonly placeholder = input('Selecciona una opción');

  readonly value = signal<string | null>(null);
  readonly open = signal(false);
  readonly disabled = signal(false);

  readonly selectedLabel = computed(() => {
    const v = this.value();
    if (v === null || v === '') {
      return null;
    }
    return this.options().find((o) => o.value === v)?.label ?? null;
  });

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    fromEvent(document, 'scroll', { capture: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.close());
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  toggle(): void {
    if (this.disabled()) {
      return;
    }
    this.open.update((v) => !v);
    if (this.open()) {
      this.onTouched();
    }
  }

  close(): void {
    this.open.set(false);
    this.onTouched();
  }

  pick(option: SelectOption): void {
    if (option.disabled) {
      return;
    }
    this.value.set(option.value);
    this.onChange(option.value);
    this.close();
  }
}
