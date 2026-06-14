import { ShippingConfig } from './shipping.model';

/** Secciones del panel de configuración (extensible). */
export type SettingsSectionId = 'general' | 'contact' | 'payments' | 'shipping';

export interface SettingsSection {
  id: SettingsSectionId;
  label: string;
  description: string;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: 'general',
    label: 'General',
    description: 'Información base del negocio.',
  },
  {
    id: 'contact',
    label: 'Contacto',
    description: 'Canales visibles para tus clientes.',
  },
  {
    id: 'payments',
    label: 'Pagos',
    description: 'Datos para Nequi y Bancolombia.',
  },
  {
    id: 'shipping',
    label: 'Domicilio',
    description: 'Punto de producción y tarifas de entrega.',
  },
];

export interface BusinessSettings {
  whatsappNumber: string;
  nequi: string;
  bancolombiaAccount: string;
  bancolombiaHolder: string;
  shipping: ShippingConfig;
  updatedAt?: string;
}

export interface BusinessSettingsRow {
  id: number;
  nequi: string;
  bancolombia_account: string;
  bancolombia_holder: string;
  whatsapp_number: string;
  shipping_origin_lat: number;
  shipping_origin_lng: number;
  shipping_origin_label: string;
  shipping_free_radius_km: number;
  shipping_reference_cost: number;
  shipping_per_km: number;
  shipping_max_cost: number;
  shipping_round_to: number;
  updated_at?: string;
}

export function mapBusinessSettingsRow(row: BusinessSettingsRow): BusinessSettings {
  return {
    nequi: row.nequi,
    bancolombiaAccount: row.bancolombia_account,
    bancolombiaHolder: row.bancolombia_holder,
    whatsappNumber: row.whatsapp_number,
    shipping: {
      origin: {
        lat: Number(row.shipping_origin_lat),
        lng: Number(row.shipping_origin_lng),
        label: row.shipping_origin_label,
      },
      freeRadiusKm: Number(row.shipping_free_radius_km),
      malamboReferenceCost: Number(row.shipping_reference_cost),
      perKmBeyondFree: Number(row.shipping_per_km),
      maxCost: Number(row.shipping_max_cost),
      roundTo: Number(row.shipping_round_to),
    },
    updatedAt: row.updated_at,
  };
}
