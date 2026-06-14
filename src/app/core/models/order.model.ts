export type OrderStatus =
  | 'pending_payment'
  | 'payment_validated'
  | 'preparing'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'nequi' | 'bancolombia';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Pendiente pago',
  payment_validated: 'Pago validado',
  preparing: 'En preparación',
  on_the_way: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

/** Secuencia de avance del pedido (cancelado queda fuera del flujo). */
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'pending_payment',
  'payment_validated',
  'preparing',
  'on_the_way',
  'delivered',
];

export interface DashboardSalesPoint {
  day: string;
  total: number;
  count: number;
}

export interface DashboardTopProduct {
  name: string;
  qty: number;
}

export interface DashboardMetrics {
  orders_total: number;
  pending: number;
  validated: number;
  preparing: number;
  on_the_way: number;
  delivered: number;
  cancelled: number;
  active: number;
  revenue: number;
  revenue_month: number;
  avg_ticket: number;
  customers: number;
  sales_7d: DashboardSalesPoint[];
  top_products: DashboardTopProduct[];
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  created_at: string;
}

export interface OrderTrackingItem {
  productName: string;
  quantity: number;
  subtotal: number;
}

export interface OrderTracking {
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  address: string;
  deliveryDate: string;
  deliveryTime: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  createdAt: string;
  history: OrderStatusHistoryEntry[];
  items: OrderTrackingItem[];
}

export interface OrderItem {
  id?: string;
  orderId?: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id?: string;
  orderNumber?: string;
  customerName: string;
  customerPhone: string;
  address: string;
  notes?: string | null;
  deliveryDate: string;
  deliveryTime: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  items: OrderItem[];
  paymentMethod?: PaymentMethod;
  receiptUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
