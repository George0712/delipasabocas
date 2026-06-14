import { inject, Injectable, signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import {
  BusinessSettings,
  BusinessSettingsRow,
  mapBusinessSettingsRow,
} from '../models/business-settings.model';
import { SupabaseService } from './supabase.service';

const TABLE = 'business_settings';
const ROW_ID = 1;

@Injectable({ providedIn: 'root' })
export class BusinessSettingsService {
  private readonly supabase = inject(SupabaseService);

  /** Número de WhatsApp en uso (código país + celular, sin +). */
  readonly whatsappNumber = signal(environment.whatsappNumber);

  constructor() {
    void this.get().then((settings) => this.applyToCache(settings));
  }

  /** Valores por defecto del entorno si aún no hay fila en Supabase. */
  private fallback(): BusinessSettings {
    return {
      nequi: environment.business.nequi,
      bancolombiaAccount: environment.business.bancolombiaAccount,
      bancolombiaHolder: environment.business.bancolombiaHolder,
      whatsappNumber: environment.whatsappNumber,
    };
  }

  private applyToCache(settings: BusinessSettings): void {
    this.whatsappNumber.set(settings.whatsappNumber);
  }

  private normalizeWhatsapp(value: string): string {
    return value.replace(/\D/g, '');
  }

  async get(): Promise<BusinessSettings> {
    const { data, error } = await this.supabase.client
      .from(TABLE)
      .select('*')
      .eq('id', ROW_ID)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return this.fallback();
    }
    return mapBusinessSettingsRow(data as BusinessSettingsRow);
  }

  async save(settings: BusinessSettings): Promise<BusinessSettings> {
    const payload = {
      id: ROW_ID,
      nequi: settings.nequi.trim(),
      bancolombia_account: settings.bancolombiaAccount.trim(),
      bancolombia_holder: settings.bancolombiaHolder.trim(),
      whatsapp_number: this.normalizeWhatsapp(settings.whatsappNumber),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase.client
      .from(TABLE)
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const saved = mapBusinessSettingsRow(data as BusinessSettingsRow);
    this.applyToCache(saved);
    return saved;
  }
}
