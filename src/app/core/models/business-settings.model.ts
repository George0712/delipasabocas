export interface BusinessSettings {
  nequi: string;
  bancolombiaAccount: string;
  bancolombiaHolder: string;
  whatsappNumber: string;
  updatedAt?: string;
}

export interface BusinessSettingsRow {
  id: number;
  nequi: string;
  bancolombia_account: string;
  bancolombia_holder: string;
  whatsapp_number: string;
  updated_at?: string;
}

export function mapBusinessSettingsRow(row: BusinessSettingsRow): BusinessSettings {
  return {
    nequi: row.nequi,
    bancolombiaAccount: row.bancolombia_account,
    bancolombiaHolder: row.bancolombia_holder,
    whatsappNumber: row.whatsapp_number,
    updatedAt: row.updated_at,
  };
}
