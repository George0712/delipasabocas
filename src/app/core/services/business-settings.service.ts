import { inject, Injectable, signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import {
  BusinessSettings,
  BusinessSettingsRow,
  mapBusinessSettingsRow,
} from '../models/business-settings.model';
import { ShippingConfig } from '../models/shipping.model';
import { SupabaseService } from './supabase.service';

const TABLE = 'business_settings';
const ROW_ID = 1;

@Injectable({ providedIn: 'root' })
export class BusinessSettingsService {
  private readonly supabase = inject(SupabaseService);

  readonly whatsappNumber = signal(environment.whatsappNumber);
  readonly shippingConfig = signal<ShippingConfig>(
    environment.business.shipping,
  );

  constructor() {
    void this.get().then((settings) => this.applyToCache(settings));
  }

  private fallback(): BusinessSettings {
    return {
      nequi: environment.business.nequi,
      bancolombiaAccount: environment.business.bancolombiaAccount,
      bancolombiaHolder: environment.business.bancolombiaHolder,
      whatsappNumber: environment.whatsappNumber,
      shipping: environment.business.shipping,
    };
  }

  private applyToCache(settings: BusinessSettings): void {
    this.whatsappNumber.set(settings.whatsappNumber);
    this.shippingConfig.set(settings.shipping);
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
    const { shipping } = settings;
    const payload = {
      id: ROW_ID,
      nequi: settings.nequi.trim(),
      bancolombia_account: settings.bancolombiaAccount.trim(),
      bancolombia_holder: settings.bancolombiaHolder.trim(),
      whatsapp_number: this.normalizeWhatsapp(settings.whatsappNumber),
      shipping_origin_lat: shipping.origin.lat,
      shipping_origin_lng: shipping.origin.lng,
      shipping_origin_label: shipping.origin.label.trim(),
      shipping_free_radius_km: shipping.freeRadiusKm,
      shipping_reference_cost: shipping.malamboReferenceCost,
      shipping_per_km: shipping.perKmBeyondFree,
      shipping_max_cost: shipping.maxCost,
      shipping_round_to: shipping.roundTo,
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
