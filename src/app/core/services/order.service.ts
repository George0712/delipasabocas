import { inject, Injectable } from '@angular/core';

import {
  DashboardMetrics,
  Order,
  OrderStatus,
  OrderTracking,
  ORDER_STATUS_LABELS,
} from '../models/order.model';
import { SupabaseService } from './supabase.service';
import { formatOrderItemName } from '../../shared/utils/format';

interface OrderItemRow {
  id: string;
  product_id: string | null;
  product_name: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  products: { name: string; description: string | null } | null;
}

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  notes: string | null;
  delivery_date: string;
  delivery_time: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  order_items?: OrderItemRow[];
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly supabase = inject(SupabaseService);

  readonly statusLabels = ORDER_STATUS_LABELS;

  /**
   * Crea el pedido junto con sus items y el registro de pago de forma
   * ATÓMICA mediante el RPC `create_order` (una sola transacción en el
   * servidor). El número de pedido lo genera el servidor y es el mismo que
   * queda guardado, evitando cualquier inconsistencia entre lo que ve el
   * cliente y lo almacenado.
   */
  async createOrder(order: Order): Promise<string> {
    const { data, error } = await this.supabase.client.rpc('create_order', {
      p_order: {
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        address: order.address,
        notes: order.notes ?? '',
        delivery_date: order.deliveryDate,
        delivery_time: order.deliveryTime,
        subtotal: order.subtotal,
        shipping_cost: order.shippingCost,
        total: order.total,
      },
      p_items: order.items.map((item) => ({
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
      })),
      p_payment_method: order.paymentMethod ?? null,
    });

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      throw new Error('No se recibió el número de pedido del servidor.');
    }

    return data as string;
  }

  async list(): Promise<Order[]> {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select(
        `
        *,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          unit_price,
          subtotal,
          products ( name, description )
        )
      `,
      )
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data as OrderRow[]).map((row) => this.mapRow(row));
  }

  /** Consulta pública del estado de un pedido por su número. */
  async getStatusByNumber(orderNumber: string): Promise<OrderTracking | null> {
    const { data, error } = await this.supabase.client.rpc('get_order_status', {
      p_order_number: orderNumber.trim(),
    });

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return null;
    }

    const row = data as {
      order_number: string;
      status: OrderStatus;
      customer_name: string;
      delivery_date: string;
      delivery_time: string;
      total: number;
      created_at: string;
      history: { status: OrderStatus; created_at: string }[];
    };

    return {
      orderNumber: row.order_number,
      status: row.status,
      customerName: row.customer_name,
      deliveryDate: row.delivery_date,
      deliveryTime: row.delivery_time,
      total: Number(row.total),
      createdAt: row.created_at,
      history: row.history ?? [],
    };
  }

  /** Métricas agregadas para el panel admin (RPC con guarda is_admin). */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const { data, error } = await this.supabase.client.rpc('admin_dashboard_metrics');

    if (error) {
      throw new Error(error.message);
    }
    return data as DashboardMetrics;
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<void> {
    const { error } = await this.supabase.client
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      throw new Error(error.message);
    }

    await this.supabase.client
      .from('status_history')
      .insert({ order_id: orderId, status });
  }

  private mapRow(row: OrderRow): Order {
    return {
      id: row.id,
      orderNumber: row.order_number,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      address: row.address,
      notes: row.notes,
      deliveryDate: row.delivery_date,
      deliveryTime: row.delivery_time,
      subtotal: Number(row.subtotal),
      shippingCost: Number(row.shipping_cost),
      total: Number(row.total),
      status: row.status,
      items: (row.order_items ?? []).map((item) => this.mapItemRow(item)),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapItemRow(item: OrderItemRow) {
    const storedName = item.product_name?.trim();
    const product = item.products;
    const rawName =
      storedName ||
      (product
        ? `${product.name}${product.description ? ` · ${product.description}` : ''}`
        : 'Ítem personalizado');

    const mapped = {
      id: item.id,
      productId: item.product_id,
      productName: rawName,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      subtotal: Number(item.subtotal),
    };

    return {
      ...mapped,
      productName: formatOrderItemName(mapped),
    };
  }
}
