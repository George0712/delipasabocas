export interface ShippingOrigin {
  lat: number;
  lng: number;
  label: string;
}

export interface ShippingConfig {
  origin: ShippingOrigin;
  /** Radio en km donde no se cobra domicilio (Malambo y alrededores inmediatos). */
  freeRadiusKm: number;
  /** Costo de referencia en Malambo (3k–4k); base para estimar fuera del radio gratis. */
  malamboReferenceCost: number;
  /** Recargo por km adicional fuera del radio gratis. */
  perKmBeyondFree: number;
  /** Tope máximo de domicilio. */
  maxCost: number;
  /** Redondeo del valor final (ej. 500 → $10.500). */
  roundTo: number;
}

export type ShippingZone =
  | 'malambo'
  | 'nearby'
  | 'soledad'
  | 'barranquilla'
  | 'far'
  | 'unknown';

export interface ShippingQuote {
  cost: number;
  distanceKm: number | null;
  zone: ShippingZone;
  label: string;
  isEstimate: boolean;
}
