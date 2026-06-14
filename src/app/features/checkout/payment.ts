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
    <app-flow-header title="Pago" />

    <main class="px-4 pb-44 pt-2">
      <h2 class="mb-4 text-base font-semibold text-gray-800">
        4. Realiza tu pago
      </h2>

      <p class="mb-3 text-xs text-gray-500">
        Realiza el pago por Nequi o Transferencia Bancolombia
      </p>

      <div class="grid grid-cols-2 gap-3">
        @for (method of methods; track method.id) {
          <button
            type="button"
            (click)="selectMethod(method.id)"
            class="rounded-xl border bg-white py-3 text-sm font-semibold transition"
            [class.border-brand-500]="selected() === method.id"
            [class.text-brand-600]="selected() === method.id"
            [class.border-cream-200]="selected() !== method.id"
            [class.text-gray-600]="selected() !== method.id"
          >
            {{ method.label }}
          </button>
        }
      </div>

      <div class="mt-5 rounded-2xl border border-cream-200 bg-white p-4">
        @if (selected() === 'nequi') {
          <p class="text-sm font-semibold text-gray-800">Nequi</p>
          <app-qr-image
            class="my-4 block"
            [src]="nequiQrImage"
            alt="Código QR de Nequi para pagar"
          />
          <p class="text-center text-sm text-gray-600">
            o al número
            <span class="font-semibold text-gray-900">{{ business().nequi }}</span>
          </p>
        } @else {
          <p class="text-sm font-semibold text-gray-800">Bancolombia</p>
          <p class="mt-3 text-sm text-gray-600">Ahorros</p>
          <p class="text-lg font-bold text-gray-900">
            {{ business().bancolombiaAccount }}
          </p>
          <p class="mt-1 text-sm text-gray-600">
            Titular: {{ business().bancolombiaHolder }}
          </p>
        }
      </div>

      <div class="mt-6 rounded-2xl border border-green-100 bg-green-50/60 p-4">
        <p class="text-sm font-medium text-gray-700">¿Ya pagaste?</p>
        <p class="mb-3 mt-0.5 text-xs text-gray-500">
          Envíanos el comprobante por WhatsApp para verificar tu pago más
          rápido. También podrás hacerlo al confirmar el pedido.
        </p>
        <app-whatsapp-button
          label="Enviar comprobante por WhatsApp"
          variant="soft"
          [fullWidth]="true"
          [message]="receiptMessage()"
        />
      </div>
    </main>

    <footer
      class="fixed inset-x-0 bottom-0 space-y-3 border-t border-cream-200 bg-cream-50/95 p-4 backdrop-blur"
    >
      <app-whatsapp-button
        class="absolute bottom-full right-4 mb-3"
        variant="icon"
        [message]="supportMessage()"
      />
      <div class="flex justify-between text-base font-bold text-gray-900">
        <span>Total</span>
        <span>{{ orderState.total() | cop }}</span>
      </div>
      <button
        type="button"
        [disabled]="submitting()"
        (click)="placeOrder()"
        class="w-full rounded-xl bg-brand-500 py-3.5 text-sm font-semibold text-white shadow-md transition enabled:hover:bg-brand-600 disabled:opacity-40"
      >
        {{ submitting() ? 'Enviando...' : 'Realizar pedido' }}
      </button>
      @if (error()) {
        <p class="text-center text-xs text-red-500">{{ error() }}</p>
      }
    </footer>
  `,
})
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
