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
        class="app-card app-card-interactive w-full max-w-[min(100%,20rem)] p-3"
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
      <p class="app-text-muted text-center text-xs">
        Toca el código para verlo en grande y escanearlo más fácil
      </p>
    </div>

    @if (expanded()) {
      <div class="app-modal-overlay z-50 flex items-center justify-center p-6" role="dialog" aria-modal="true" [attr.aria-label]="alt()" (click)="close()">
        <div class="app-card w-full max-w-sm p-4" (click)="$event.stopPropagation()">
          <img [src]="src()" [alt]="alt()" class="qr-code mx-auto block w-full bg-white" />
          <p class="app-text-muted mt-3 text-center text-sm">Escanea con la cámara de Nequi</p>
          <button type="button" (click)="close()" class="app-btn-primary mt-4 w-full">Cerrar</button>
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
