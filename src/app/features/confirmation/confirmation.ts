import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';

import { OrderStateService } from '../../core/services/order-state.service';
import { CopPipe } from '../../shared/pipes/cop.pipe';
import { DateCoPipe } from '../../shared/pipes/date-co.pipe';
import { TimeCoPipe } from '../../shared/pipes/time-co.pipe';
import { WhatsappButton } from '../../shared/components/whatsapp-button/whatsapp-button';
import { whatsappConfirmationReceiptMessage } from '../../shared/utils/whatsapp-messages';
import { launchConfetti } from '../../shared/utils/confetti';

@Component({
  selector: 'app-confirmation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CopPipe, DateCoPipe, TimeCoPipe, WhatsappButton],
  template: `
    <main class="app-shell app-page flex min-h-screen flex-col items-center px-6 pt-16 text-center">
      <div class="relative grid h-24 w-24 place-items-center">
        <span class="animate-success-ring absolute inset-0 rounded-full bg-green-300"></span>
        <div class="animate-success-pop relative grid h-24 w-24 place-items-center rounded-full bg-[#ecfdf5] text-[#047857]">
          <svg viewBox="0 0 24 24" class="h-12 w-12" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <h1 class="app-heading animate-fade-up mt-6 text-2xl">¡Pedido recibido!</h1>
      <p class="app-subheading animate-fade-up mt-2 max-w-xs">
        Tu pedido fue registrado. El pago quedará
        <span class="app-text font-medium">pendiente de verificación.</span>
        Te confirmaremos por WhatsApp.
      </p>

      <div class="app-card animate-fade-up mt-8 w-full max-w-sm p-6">
        <p class="app-eyebrow">Número de pedido</p>
        <p class="app-text-primary mt-1 text-2xl font-extrabold">#{{ order()?.orderNumber }}</p>

        <dl class="mt-5 space-y-2 text-left text-sm">
          <div class="flex justify-between">
            <dt class="app-text-muted">Total</dt>
            <dd class="app-text font-semibold">{{ order()?.total | cop }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="app-text-muted">Fecha de entrega</dt>
            <dd class="app-text font-semibold">{{ order()?.deliveryDate | dateCo }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="app-text-muted">Hora aproximada</dt>
            <dd class="app-text font-semibold">{{ order()?.deliveryTime | timeCo }}</dd>
          </div>
        </dl>
      </div>

      <div class="animate-fade-up mt-8 w-full max-w-sm space-y-3">
        <button type="button" (click)="track()" class="app-btn-primary w-full">Ver seguimiento del pedido</button>
        <app-whatsapp-button label="Enviar comprobante por WhatsApp" [fullWidth]="true" [message]="receiptMessage()" />
        <button type="button" (click)="newOrder()" class="app-btn-ghost w-full">Hacer otro pedido</button>
      </div>
    </main>
  `,
})
export class Confirmation implements OnInit {
  private readonly router = inject(Router);
  private readonly orderState = inject(OrderStateService);

  readonly order = this.orderState.confirmedOrder;

  readonly receiptMessage = computed(() => {
    const o = this.order();
    if (!o?.orderNumber) {
      return '';
    }
    return whatsappConfirmationReceiptMessage(o.orderNumber);
  });

  constructor() {
    afterNextRender(() => {
      if (this.order()) {
        launchConfetti();
      }
    });
  }

  ngOnInit(): void {
    if (!this.order()) {
      this.router.navigate(['/']);
    }
  }

  track(): void {
    const number = this.order()?.orderNumber;
    if (number) {
      this.router.navigate(['/seguimiento', number]);
    }
  }

  newOrder(): void {
    this.orderState.reset();
    this.router.navigate(['/']);
  }
}
