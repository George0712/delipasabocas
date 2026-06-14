export type ProductKind = 'tray' | 'combo';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number | null;
  imageUrl: string | null;
  available: boolean;
  deleted: boolean;
  kind: ProductKind;
  /** Precio de referencia (bandejas sueltas) para mostrar ahorro en combos. */
  referencePrice: number | null;
  /** Bandejas físicas que representa (freír, logística). */
  trayCount: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Fila tal cual la entrega Supabase (snake_case). */
export interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number | null;
  image_url: string | null;
  available: boolean;
  deleted: boolean;
  kind: ProductKind;
  reference_price: number | null;
  tray_count: number;
  created_at?: string;
  updated_at?: string;
}

export function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    stock: row.stock === null || row.stock === undefined ? null : Number(row.stock),
    imageUrl: row.image_url,
    available: row.available,
    deleted: row.deleted ?? false,
    kind: row.kind ?? 'tray',
    referencePrice:
      row.reference_price === null || row.reference_price === undefined
        ? null
        : Number(row.reference_price),
    trayCount: row.tray_count ?? 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function isCombo(product: Product): boolean {
  return product.kind === 'combo';
}

export function productSavings(product: Product): number {
  if (!product.referencePrice || product.referencePrice <= product.price) {
    return 0;
  }
  return product.referencePrice - product.price;
}
