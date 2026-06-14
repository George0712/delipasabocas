import { inject, Injectable } from '@angular/core';

import {
  ShippingConfig,
  ShippingQuote,
  ShippingZone,
} from '../models/shipping.model';
import { BusinessSettingsService } from './business-settings.service';

interface CityHint {
  keys: string[];
  distanceKm: number;
  zone: ShippingZone;
  label: string;
}

/** Distancias aproximadas desde el punto de producción en Malambo. */
const CITY_HINTS: CityHint[] = [
  { keys: ['malambo'], distanceKm: 0, zone: 'malambo', label: 'Malambo' },
  { keys: ['galapa'], distanceKm: 12, zone: 'nearby', label: 'Galapa' },
  { keys: ['palmar de varela', 'palmar'], distanceKm: 18, zone: 'nearby', label: 'Palmar de Varela' },
  { keys: ['soledad'], distanceKm: 16, zone: 'soledad', label: 'Soledad' },
  { keys: ['sabanagrande'], distanceKm: 22, zone: 'nearby', label: 'Sabanagrande' },
  {
    keys: ['barranquilla', 'bquilla', 'b/quilla'],
    distanceKm: 28,
    zone: 'barranquilla',
    label: 'Barranquilla',
  },
  { keys: ['puerto colombia'], distanceKm: 32, zone: 'far', label: 'Puerto Colombia' },
  { keys: ['tubara', 'tubará'], distanceKm: 35, zone: 'far', label: 'Tubará' },
];

@Injectable({ providedIn: 'root' })
export class ShippingService {
  private readonly settings = inject(BusinessSettingsService);

  private get config(): ShippingConfig {
    return this.settings.shippingConfig();
  }

  async estimate(address: string): Promise<ShippingQuote> {
    const normalized = this.normalize(address);
    if (normalized.length < 5) {
      return this.emptyQuote();
    }

    const coords = await this.geocode(normalized);
    if (coords) {
      const distanceKm = this.haversineKm(this.config.origin, coords);
      return this.quoteFromDistance(distanceKm, this.zoneFromDistance(distanceKm), true);
    }

    const hint = this.matchCityHint(normalized);
    if (hint) {
      return this.quoteFromDistance(hint.distanceKm, hint.zone, true, hint.label);
    }

    return {
      cost: this.roundCost(this.config.malamboReferenceCost + 6000),
      distanceKm: null,
      zone: 'unknown',
      label: 'Zona por confirmar',
      isEstimate: true,
    };
  }

  private quoteFromDistance(
    distanceKm: number,
    zone: ShippingZone,
    isEstimate: boolean,
    placeLabel?: string,
  ): ShippingQuote {
    const roundedDistance = Math.round(distanceKm * 10) / 10;
    const cost = this.costForDistance(distanceKm);
    const label = this.buildLabel(zone, roundedDistance, placeLabel, cost);

    return {
      cost,
      distanceKm: roundedDistance,
      zone,
      label,
      isEstimate,
    };
  }

  private costForDistance(distanceKm: number): number {
    const {
      freeRadiusKm,
      malamboReferenceCost,
      perKmBeyondFree,
      maxCost,
    } = this.config;

    if (distanceKm <= freeRadiusKm) {
      return 0;
    }

    const extraKm = distanceKm - freeRadiusKm;
    const raw = malamboReferenceCost + Math.max(0, extraKm) * perKmBeyondFree;

    return Math.min(maxCost, this.roundCost(raw));
  }

  private zoneFromDistance(distanceKm: number): ShippingZone {
    if (distanceKm <= this.config.freeRadiusKm) {
      return 'malambo';
    }
    if (distanceKm <= 20) {
      return 'nearby';
    }
    if (distanceKm <= 24) {
      return 'soledad';
    }
    if (distanceKm <= 32) {
      return 'barranquilla';
    }
    return 'far';
  }

  private buildLabel(
    zone: ShippingZone,
    distanceKm: number,
    placeLabel: string | undefined,
    cost: number,
  ): string {
    if (cost === 0) {
      return 'Gratis en Malambo';
    }

    const place = placeLabel ?? this.defaultPlaceLabel(zone);
    const distance =
      distanceKm > 0 ? ` · ~${distanceKm.toLocaleString('es-CO')} km` : '';

    return `Estimado ${place}${distance}`;
  }

  private defaultPlaceLabel(zone: ShippingZone): string {
    switch (zone) {
      case 'soledad':
        return 'Soledad';
      case 'barranquilla':
        return 'Barranquilla';
      case 'far':
        return 'zona lejana';
      case 'nearby':
        return 'cerca de Malambo';
      default:
        return 'fuera de Malambo';
    }
  }

  private matchCityHint(address: string): CityHint | null {
    const matches = CITY_HINTS.filter((hint) =>
      hint.keys.some((key) => address.includes(key)),
    );

    if (matches.length === 0) {
      return null;
    }

    return matches.reduce((farther, current) =>
      current.distanceKm > farther.distanceKm ? current : farther,
    );
  }

  private async geocode(
    address: string,
  ): Promise<{ lat: number; lng: number } | null> {
    const query = `${address}, Atlántico, Colombia`;
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'co');

    try {
      const response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        return null;
      }

      const results = (await response.json()) as { lat: string; lon: string }[];
      const hit = results[0];
      if (!hit) {
        return null;
      }

      return { lat: Number(hit.lat), lng: Number(hit.lon) };
    } catch {
      return null;
    }
  }

  private haversineKm(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(destination.lat - origin.lat);
    const dLng = toRad(destination.lng - origin.lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(origin.lat)) *
        Math.cos(toRad(destination.lat)) *
        Math.sin(dLng / 2) ** 2;

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private roundCost(value: number): number {
    const step = this.config.roundTo;
    return Math.round(value / step) * step;
  }

  private normalize(address: string): string {
    return address
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private emptyQuote(): ShippingQuote {
    return {
      cost: 0,
      distanceKm: null,
      zone: 'unknown',
      label: 'Ingresa la dirección',
      isEstimate: false,
    };
  }
}
