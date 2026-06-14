import { inject, Injectable } from '@angular/core';

import {
  mapProductRow,
  Product,
  ProductKind,
  ProductRow,
} from '../models/product.model';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly supabase = inject(SupabaseService);
  private readonly table = 'products';

  async getAvailable(kind?: ProductKind): Promise<Product[]> {
    let query = this.supabase.client
      .from(this.table)
      .select('*')
      .eq('available', true)
      .eq('deleted', false)
      .order('created_at', { ascending: true });

    if (kind) {
      query = query.eq('kind', kind);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }
    return (data as ProductRow[]).map(mapProductRow);
  }

  async getAvailableTrays(): Promise<Product[]> {
    return this.getAvailable('tray');
  }

  async getAvailableCombos(): Promise<Product[]> {
    return this.getAvailable('combo');
  }

  async getAll(kind?: ProductKind): Promise<Product[]> {
    let query = this.supabase.client
      .from(this.table)
      .select('*')
      .eq('deleted', false)
      .order('created_at', { ascending: true });

    if (kind) {
      query = query.eq('kind', kind);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }
    return (data as ProductRow[]).map(mapProductRow);
  }

  async create(product: Omit<Product, 'id'>): Promise<Product> {
    const { data, error } = await this.supabase.client
      .from(this.table)
      .insert({
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        image_url: product.imageUrl,
        available: product.available,
        kind: product.kind,
        reference_price: product.referencePrice,
        tray_count: product.trayCount,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return mapProductRow(data as ProductRow);
  }

  async update(id: string, changes: Partial<Product>): Promise<Product> {
    const payload: Record<string, unknown> = {};
    if (changes.name !== undefined) payload['name'] = changes.name;
    if (changes.description !== undefined) payload['description'] = changes.description;
    if (changes.price !== undefined) payload['price'] = changes.price;
    if (changes.stock !== undefined) payload['stock'] = changes.stock;
    if (changes.imageUrl !== undefined) payload['image_url'] = changes.imageUrl;
    if (changes.available !== undefined) payload['available'] = changes.available;
    if (changes.kind !== undefined) payload['kind'] = changes.kind;
    if (changes.referencePrice !== undefined) payload['reference_price'] = changes.referencePrice;
    if (changes.trayCount !== undefined) payload['tray_count'] = changes.trayCount;

    const { data, error } = await this.supabase.client
      .from(this.table)
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return mapProductRow(data as ProductRow);
  }

  /**
   * Eliminado lógico: marca el producto como eliminado solo si no afecta
   * pedidos activos. Devuelve false si el producto está ligado a pedidos en curso.
   */
  async softDelete(id: string): Promise<boolean> {
    const { data, error } = await this.supabase.client.rpc('product_soft_delete', {
      p_id: id,
    });

    if (error) {
      throw new Error(error.message);
    }
    return data === true;
  }
}
