import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { BusinessSettings } from '../../core/models/business-settings.model';
import { Order, PaymentMethod } from '../../core/models/order.model';
import { BusinessSettingsService } from '../../core/services/business-settings.service';
import { OrderService } from '../../core/services/order.service';
import { OrderStateService } from '../../core/services/order-state.service';
import { CopPipe } from '../../shared/pipes/cop.pipe';
import { FlowHeader } from '../../shared/components/flow-header/flow-header';
import { QrImage } from '../../shared/components/qr-image/qr-image';
import { WhatsappButton } from '../../shared/components/whatsapp-button/whatsapp-button';
import {
  whatsappPaymentReceiptMessage,
  whatsappPaymentSupportMessage,
} from '../../shared/utils/whatsapp-messages';

@Component({
  selector: 'app-payment',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CopPipe, FlowHeader, QrImage, WhatsappButton],
  template: `
    <div class="app-shell app-page">
    <app-flow-header title="Pago" />

    <main class="px-4 pb-44 pt-2">
      <h2 class="app-heading mb-4">4. Realiza tu pago</h2>
      <p class="app-subheading mb-3">Realiza el pago por Nequi o Transferencia Bancolombia</p>

      <div class="grid grid-cols-2 gap-3">
        @for (method of methods; track method.id) {
          <button type="button" (click)="selectMethod(method.id)" class="app-chip" [class.app-chip-active]="selected() === method.id">
            {{ method.label }}
          </button>
        }
      </div>

      <div class="app-card mt-5 p-4">
        @if (selected() === 'nequi') {
          <p class="app-text text-sm font-semibold">Nequi</p>
          <app-qr-image class="my-4 block" [src]="nequiQrImage" alt="Código QR de Nequi para pagar" />
          <p class="app-text-secondary text-center text-sm">
            o al número <span class="app-text font-semibold">{{ business().nequi }}</span>
          </p>
        } @else {
          <p class="app-text text-sm font-semibold">Bancolombia</p>
          <p class="app-text-secondary mt-3 text-sm">Ahorros</p>
          <p class="app-text text-lg font-bold">{{ business().bancolombiaAccount }}</p>
          <p class="app-text-secondary mt-1 text-sm">Titular: {{ business().bancolombiaHolder }}</p>
        }
      </div>

      <div class="app-alert-success mt-6">
        <p class="app-text text-sm font-medium">¿Ya pagaste?</p>
        <p class="app-text-muted mb-3 mt-0.5 text-xs">
          Envíanos el comprobante por WhatsApp para verificar tu pago más rápido.
          También podrás hacerlo al confirmar el pedido.
        </p>
        <app-whatsapp-button label="Enviar comprobante por WhatsApp" variant="soft" [fullWidth]="true" [message]="receiptMessage()" />
      </div>
    </main>

    <footer class="app-footer-bar">
      <app-whatsapp-button class="absolute bottom-full right-4 mb-3" variant="icon" [message]="supportMessage()" />
      <div class="app-text flex justify-between text-base font-bold">
        <span>Total</span>
        <span>{{ orderState.total() | cop }}</span>
      </div>
      <button type="button" [disabled]="submitting()" (click)="placeOrder()" class="app-btn-primary w-full">
        {{ submitting() ? 'Enviando...' : 'Realizar pedido' }}
      </button>
      @if (error()) {
        <p class="text-center text-xs text-red-600">{{ error() }}</p>
      }
    </footer>
    </div>
  `,})
export class Payment implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly settingsService = inject(BusinessSettingsService);
  private readonly router = inject(Router);
  protected readonly orderState = inject(OrderStateService);

  readonly nequiQrImage = environment.business.nequiQrImage;
  readonly business = signal<BusinessSettings>({
    nequi: environment.business.nequi,
    bancolombiaAccount: environment.business.bancolombiaAccount,
    bancolombiaHolder: environment.business.bancolombiaHolder,
    whatsappNumber: environment.whatsappNumber,
    shipping: environment.business.shipping,
  });
  readonly methods: { id: PaymentMethod; label: string }[] = [
    { id: 'nequi', label: 'Nequi' },
    { id: 'bancolombia', label: 'Bancolombia' },
  ];

  readonly selected = signal<PaymentMethod>('nequi');
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    if (!this.orderState.hasItems() || !this.orderState.delivery()) {
      this.router.navigate(['/']);
      return;
    }

    void this.settingsService.get().then((settings) => this.business.set(settings));
  }

  selectMethod(method: PaymentMethod): void {
    this.selected.set(method);
    this.orderState.setPaymentMethod(method);
  }

  receiptMessage(): string {
    const delivery = this.orderState.delivery();
    const name = delivery?.customerName ?? '';
    return whatsappPaymentReceiptMessage(name, this.orderState.total());
  }

  supportMessage(): string {
    const delivery = this.orderState.delivery();
    return whatsappPaymentSupportMessage(
      delivery?.customerName,
      this.orderState.total(),
    );
  }

  async placeOrder(): Promise<void> {
    const delivery = this.orderState.delivery();
    if (!delivery) {
      this.router.navigate(['/']);
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const order: Order = {
      customerName: delivery.customerName,
      customerPhone: delivery.customerPhone,
      address: delivery.address,
      notes: delivery.notes,
      deliveryDate: delivery.deliveryDate,
      deliveryTime: delivery.deliveryTime,
      subtotal: this.orderState.subtotal(),
      shippingCost: this.orderState.shippingCost(),
      total: this.orderState.total(),
      status: 'pending_payment',
      items: this.orderState.items(),
      paymentMethod: this.selected(),
    };

    try {
      // El servidor crea el pedido de forma atómica y devuelve el número
      // real (el mismo que queda guardado). No se generan números locales.
      const orderNumber = await this.orderService.createOrder(order);
      this.orderState.setConfirmedOrder({
        orderNumber,
        total: order.total,
        deliveryDate: order.deliveryDate,
        deliveryTime: order.deliveryTime,
      });
      // Limpiar el pedido en curso para que el siguiente empiece en blanco.
      this.orderState.clearCart();
      this.router.navigate(['/confirmacion']);
    } catch (err) {
      console.error('No se pudo registrar el pedido:', err);
      this.error.set(
        'No pudimos registrar tu pedido. Verifica tu conexión e inténtalo de nuevo.',
      );
    } finally {
      this.submitting.set(false);
    }
  }
}
