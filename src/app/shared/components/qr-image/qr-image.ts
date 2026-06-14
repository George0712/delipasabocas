import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-qr-image',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center gap-2">
      <button
        type="button"
        (click)="open()"
        class="w-full max-w-[min(100%,20rem)] rounded-2xl border-2 border-cream-200 bg-white p-3 shadow-sm transition active:scale-[0.99]"
        [attr.aria-label]="'Ampliar ' + alt()"
      >
        <img
          [src]="src()"
          [alt]="alt()"
          width="320"
          height="320"
          loading="eager"
          decoding="async"
          class="qr-code mx-auto block w-full max-w-[18rem] bg-white"
        />
      </button>
      <p class="text-center text-xs text-gray-400">
        Toca el código para verlo en grande y escanearlo más fácil
      </p>
    </div>

    @if (expanded()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="alt()"
        (click)="close()"
      >
        <div
          class="w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <img
            [src]="src()"
            [alt]="alt()"
            class="qr-code mx-auto block w-full bg-white"
          />
          <p class="mt-3 text-center text-sm text-gray-500">
            Escanea con la cámara de Nequi
          </p>
          <button
            type="button"
            (click)="close()"
            class="mt-4 w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white"
          >
            Cerrar
          </button>
        </div>
      </div>
    }
  `,
  styles: `
    .qr-code {
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }
  `,
})
export class QrImage {
  readonly src = input.required<string>();
  readonly alt = input<string>('Código QR');

  readonly expanded = signal(false);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  open(): void {
    this.expanded.set(true);
  }

  close(): void {
    this.expanded.set(false);
  }
}
