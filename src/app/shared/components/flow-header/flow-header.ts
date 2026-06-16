import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-flow-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="app-header">
      @if (showBack()) {
        <button
          type="button"
          (click)="goBack()"
          aria-label="Volver"
          class="grid h-9 w-9 place-items-center rounded-xl transition"
          [style.color]="'var(--app-text-secondary)'"
          [style.background]="'var(--app-surface)'"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      }
      <h1 class="app-heading flex-1 text-center text-base">
        {{ title() }}
      </h1>
      @if (showBack()) {
        <span class="h-9 w-9" aria-hidden="true"></span>
      }
    </header>
  `,
})
export class FlowHeader {
  readonly title = input.required<string>();
  readonly showBack = input<boolean>(true);

  private readonly location = inject(Location);

  goBack(): void {
    this.location.back();
  }
}
