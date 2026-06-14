import { Product } from '../../core/models/product.model';

/**
 * Combos recomendados de respaldo cuando aún no hay conexión a Supabase.
 * En producción los gestiona el admin como productos tipo "combo".
 */
export const DEFAULT_COMBOS: Product[] = [
  {
    id: 'combo-50',
    name: 'Combo 50',
    description: '25 empanadas + 25 deditos',
    price: 58000,
    referencePrice: 63000,
    trayCount: 2,
    stock: null,
    imageUrl: null,
    available: true,
    deleted: false,
    kind: 'combo',
  },
  {
    id: 'combo-100',
    name: 'Combo 100',
    description: '50 empanadas + 50 deditos',
    price: 110000,
    referencePrice: 121000,
    trayCount: 4,
    stock: null,
    imageUrl: null,
    available: true,
    deleted: false,
    kind: 'combo',
  },
  {
    id: 'combo-150',
    name: 'Combo 150',
    description: '75 empanadas + 75 deditos',
    price: 165000,
    referencePrice: 184000,
    trayCount: 6,
    stock: null,
    imageUrl: null,
    available: true,
    deleted: false,
    kind: 'combo',
  },
];
