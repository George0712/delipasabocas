import { computed, Injectable, signal } from '@angular/core';

import {
  OrderItem,
  PaymentMethod,
} from '../models/order.model';

export interface DeliveryInfo {
  customerName: string;
  customerPhone: string;
  address: string;
  notes: string;
  deliveryDate: string;
  deliveryTime: string;
}

export interface ConfirmedOrder {
  orderNumber: string;
  total: number;
  deliveryDate: string;
  deliveryTime: string;
}

/**
 * Mantiene el estado del pedido en curso mientras el cliente avanza por
 * los pasos del flujo (producto → entrega → pago → confirmación).
 * Es estado de UI, no toca la base de datos.
 */
@Injectable({ providedIn: 'root' })
export class OrderStateService {
  private readonly _items = signal<OrderItem[]>([]);
  private readonly _delivery = signal<DeliveryInfo | null>(null);
  private readonly _paymentMethod = signal<PaymentMethod>('nequi');
  private readonly _shippingCost = signal<number>(0);
  private readonly _shippingLabel = signal<string>('Según dirección');
  private readonly _confirmedOrder = signal<ConfirmedOrder | null>(null);

  readonly items = this._items.asReadonly();
  readonly delivery = this._delivery.asReadonly();
  readonly paymentMethod = this._paymentMethod.asReadonly();
  readonly shippingCost = this._shippingCost.asReadonly();
  readonly shippingLabel = this._shippingLabel.asReadonly();
  readonly confirmedOrder = this._confirmedOrder.asReadonly();

  readonly subtotal = computed(() =>
    this._items().reduce((acc, item) => acc + item.subtotal, 0),
  );

  readonly total = computed(() => this.subtotal() + this._shippingCost());

  readonly hasItems = computed(() => this._items().length > 0);

  setItems(items: OrderItem[]): void {
    this._items.set(items.filter((item) => item.quantity > 0));
  }

  addItem(item: OrderItem): void {
    this._items.update((items) => {
      const existing = items.find((i) => i.productId === item.productId);
      if (existing) {
        return items.map((i) =>
          i.productId === item.productId
            ? {
                ...i,
                quantity: i.quantity + item.quantity,
                subtotal: (i.quantity + item.quantity) * i.unitPrice,
              }
            : i,
        );
      }
      return [...items, item];
    });
  }

  setShipping(cost: number, label: string): void {
    this._shippingCost.set(Math.max(0, cost));
    this._shippingLabel.set(label);
  }

  setDelivery(info: DeliveryInfo): void {
    this._delivery.set(info);
  }

  setPaymentMethod(method: PaymentMethod): void {
    this._paymentMethod.set(method);
  }

  setConfirmedOrder(order: ConfirmedOrder): void {
    this._confirmedOrder.set(order);
  }

  /**
   * Limpia el pedido en curso (items, entrega y método de pago) tras crear
   * el pedido, pero conserva `confirmedOrder` para la pantalla de
   * confirmación.
   */
  clearCart(): void {
    this._items.set([]);
    this._delivery.set(null);
    this._paymentMethod.set('nequi');
    this._shippingCost.set(0);
    this._shippingLabel.set('Según dirección');
  }

  reset(): void {
    this._items.set([]);
    this._delivery.set(null);
    this._paymentMethod.set('nequi');
    this._shippingCost.set(0);
    this._shippingLabel.set('Según dirección');
    this._confirmedOrder.set(null);
  }
}
