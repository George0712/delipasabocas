import { inject, Injectable, signal } from '@angular/core';

import { AdminOrderChange } from '../models/admin-order-change.model';
import { OrderLiveService } from './order-live.service';

export interface NewOrderAlert {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
}

type ChangeListener = (change: AdminOrderChange) => void;

/**
 * Alertas de nuevos pedidos en el panel admin: sonido + toast.
 * Mantiene una sola suscripción Realtime compartida por todo el admin.
 */
@Injectable({ providedIn: 'root' })
export class AdminOrderNotifyService {
  private readonly orderLive = inject(OrderLiveService);

  readonly alerts = signal<NewOrderAlert[]>([]);

  private readonly listeners = new Set<ChangeListener>();
  private stopListen: (() => void) | null = null;
  private audioCtx: AudioContext | null = null;
  private audioReady = false;

  ensureListening(): void {
    if (this.stopListen) {
      return;
    }

    this.prepareAudioUnlock();
    this.stopListen = this.orderLive.watchAdminOrders((change) => {
      for (const listener of this.listeners) {
        listener(change);
      }
      if (change.eventType === 'INSERT') {
        this.notifyNewOrder(change);
      }
    });
  }

  stopListening(): void {
    this.stopListen?.();
    this.stopListen = null;
  }

  onChange(listener: ChangeListener): () => void {
    this.ensureListening();
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dismiss(alertId: string): void {
    this.alerts.update((list) => list.filter((alert) => alert.id !== alertId));
  }

  private notifyNewOrder(change: AdminOrderChange): void {
    const orderNumber = change.record.order_number?.trim();
    if (!orderNumber) {
      return;
    }

    const alert: NewOrderAlert = {
      id: change.record.id ?? `${orderNumber}-${Date.now()}`,
      orderNumber,
      customerName: change.record.customer_name?.trim() || 'Cliente',
      total: Number(change.record.total ?? 0),
    };

    this.alerts.update((list) => [...list, alert].slice(-4));
    this.playNewOrderSound();

    if ('vibrate' in navigator) {
      navigator.vibrate([120, 60, 120]);
    }

    setTimeout(() => this.dismiss(alert.id), 12_000);
  }

  private prepareAudioUnlock(): void {
    if (this.audioReady) {
      return;
    }

    const unlock = (): void => {
      try {
        this.audioCtx ??= new AudioContext();
        void this.audioCtx.resume();
        this.audioReady = true;
      } catch {
        /* El navegador puede bloquear audio hasta la primera interacción. */
      }
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
    };

    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
  }

  private playNewOrderSound(): void {
    try {
      const ctx = this.audioCtx ?? new AudioContext();
      this.audioCtx = ctx;
      void ctx.resume();

      const now = ctx.currentTime;
      const notes = [
        { freq: 659.25, start: 0, duration: 0.14 },
        { freq: 880, start: 0.16, duration: 0.22 },
      ];

      for (const note of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, now + note.start);
        gain.gain.setValueAtTime(0.0001, now + note.start);
        gain.gain.exponentialRampToValueAtTime(0.22, now + note.start + 0.02);
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          now + note.start + note.duration,
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + note.start);
        osc.stop(now + note.start + note.duration + 0.05);
      }
    } catch {
      /* Sin sonido si el navegador bloquea el contexto de audio. */
    }
  }
}
