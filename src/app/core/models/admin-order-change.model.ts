export type AdminOrderEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface AdminOrderRecord {
  id?: string;
  order_number?: string;
  customer_name?: string;
  total?: number;
}

export interface AdminOrderChange {
  eventType: AdminOrderEventType;
  record: AdminOrderRecord;
}
