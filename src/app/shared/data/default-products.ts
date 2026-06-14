import { Product } from '../../core/models/product.model';

/**
 * Bandejas de respaldo cuando aún no hay conexión a Supabase.
 */
export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'tray-emp-25',
    name: 'Bandeja 25',
    description: 'Empanadas de pollo',
    price: 25000,
    stock: null,
    imageUrl: null,
    available: true,
    deleted: false,
    kind: 'tray',
    referencePrice: null,
    trayCount: 1,
  },
  {
    id: 'tray-emp-50',
    name: 'Bandeja 50',
    description: 'Empanadas de pollo',
    price: 45000,
    stock: null,
    imageUrl: null,
    available: true,
    deleted: false,
    kind: 'tray',
    referencePrice: null,
    trayCount: 1,
  },
  {
    id: 'tray-ded-25',
    name: 'Bandeja 25',
    description: 'Deditos de queso',
    price: 38000,
    stock: null,
    imageUrl: null,
    available: true,
    deleted: false,
    kind: 'tray',
    referencePrice: null,
    trayCount: 1,
  },
  {
    id: 'tray-mixta',
    name: 'Bandeja Mixta',
    description: '25 empanadas + 25 deditos',
    price: 48000,
    stock: null,
    imageUrl: null,
    available: true,
    deleted: false,
    kind: 'tray',
    referencePrice: null,
    trayCount: 1,
  },
];
