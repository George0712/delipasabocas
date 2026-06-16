import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';

/**
 * Punto único de acceso al cliente de Supabase.
 * Ningún componente debe instanciar el cliente directamente: deben
 * consumir servicios de dominio que dependan de este servicio.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          storage: localStorage,
        },
      },
    );
  }
}
