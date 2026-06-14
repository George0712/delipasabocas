import { inject, Injectable } from '@angular/core';
import type { RealtimeChannel } from '@supabase/supabase-js';

import {
  AdminOrderChange,
  AdminOrderRecord,
} from '../models/admin-order-change.model';
import { SupabaseService } from './supabase.service';

/**
 * Actualizaciones en vivo de pedidos.
 * · Admin: Supabase Realtime (INSERT/UPDATE en orders).
 * · Cliente: polling ligero del RPC público de seguimiento.
 */
@Injectable({ providedIn: 'root' })
export class OrderLiveService {
  private readonly supabase = inject(SupabaseService);

  /** Escucha cambios en pedidos. Requiere sesión admin autenticada. */
  watchAdminOrders(onChange: (change: AdminOrderChange) => void): () => void {
    const channel: RealtimeChannel = this.supabase.client
      .channel('admin-orders-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          const eventType = payload.eventType as AdminOrderChange['eventType'];
          const record = (payload.new ?? payload.old ?? {}) as AdminOrderRecord;
          onChange({ eventType, record });
        },
      )
      .subscribe();

    return () => {
      void this.supabase.client.removeChannel(channel);
    };
  }

  /** Reconsulta el estado del pedido cada pocos segundos mientras la vista está abierta. */
  watchOrderTracking(
    orderNumber: string,
    onPoll: () => void,
    intervalMs = 8000,
  ): () => void {
    const id = setInterval(onPoll, intervalMs);
    return () => clearInterval(id);
  }
}
