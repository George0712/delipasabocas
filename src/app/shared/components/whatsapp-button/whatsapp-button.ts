import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { BusinessSettingsService } from '../../../core/services/business-settings.service';

type WhatsappVariant = 'solid' | 'soft' | 'icon';

@Component({
  selector: 'app-whatsapp-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      [href]="href()"
      target="_blank"
      rel="noopener"
      [attr.aria-label]="label() || 'Contactar por WhatsApp'"
      [class]="classes()"
    >
      <svg viewBox="0 0 32 32" class="h-5 w-5 shrink-0" fill="currentColor" aria-hidden="true">
        <path
          d="M16.04 3C9.4 3 4 8.4 4 15.04c0 2.12.56 4.18 1.62 6L4 29l8.16-1.58a12 12 0 0 0 3.88.66h.01C22.7 28.08 28.1 22.68 28.1 16.04 28.1 8.4 22.7 3 16.04 3Zm7.05 17.2c-.3.84-1.74 1.6-2.38 1.66-.6.06-1.38.08-2.22-.14-.51-.16-1.17-.38-2.02-.74-3.56-1.54-5.88-5.12-6.06-5.36-.18-.24-1.45-1.93-1.45-3.68 0-1.74.92-2.6 1.24-2.96.33-.35.71-.44.95-.44.24 0 .47.01.68.01.22.01.51-.08.8.61.3.71 1 2.45 1.08 2.63.09.18.15.39.03.62-.11.24-.17.39-.34.6-.17.21-.36.46-.51.62-.17.18-.35.37-.15.72.2.35.86 1.42 1.86 2.3 1.28 1.14 2.36 1.5 2.7 1.67.33.18.53.15.72-.09.2-.24.83-.96 1.05-1.29.22-.33.44-.27.74-.16.3.11 1.93.91 2.26 1.07.33.16.55.24.63.38.08.14.08.8-.22 1.64Z"
        />
      </svg>
      @if (label()) {
        <span class="whitespace-nowrap">{{ label() }}</span>
      }
    </a>
  `,
})
export class WhatsappButton {
  private readonly settings = inject(BusinessSettingsService);

  readonly label = input<string>('');
  readonly message = input<string>('');
  readonly variant = input<WhatsappVariant>('solid');
  readonly fullWidth = input<boolean>(false);

  readonly href = computed(() => {
    const base = `https://wa.me/${this.settings.whatsappNumber()}`;
    const msg = this.message();
    return msg ? `${base}?text=${encodeURIComponent(msg)}` : base;
  });

  readonly classes = computed(() => {
    const base =
      'inline-flex items-center justify-center gap-2 font-semibold transition active:scale-95';
    const width = this.fullWidth() ? 'w-full' : '';

    switch (this.variant()) {
      case 'icon':
        return `${base} h-11 w-11 rounded-full bg-[#25D366] text-white shadow-lg shadow-green-500/30 ring-4 ring-white/60`;
      case 'soft':
        return `${base} ${width} rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700`;
      default:
        return `${base} ${width} rounded-xl bg-[#25D366] px-4 py-3 text-sm text-white shadow-md shadow-green-500/30`;
    }
  });
}
