import { computed, inject, Injectable, signal } from '@angular/core';
import { Session, User } from '@supabase/supabase-js';

import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);

  private readonly _session = signal<Session | null>(null);
  private readonly _initialized = signal(false);

  readonly session = this._session.asReadonly();
  readonly user = computed<User | null>(() => this._session()?.user ?? null);
  readonly isAuthenticated = computed(() => this._session() !== null);
  readonly initialized = this._initialized.asReadonly();

  /** Se resuelve cuando ya se restauró la sesión inicial desde el storage. */
  private readonly ready: Promise<void>;

  constructor() {
    this.ready = this.restoreSession();
    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      this._session.set(session);
      this._initialized.set(true);
    });
  }

  /** Espera a que la sesión guardada esté lista (útil al arrancar la app). */
  whenReady(): Promise<void> {
    return this.ready;
  }

  private async restoreSession(): Promise<void> {
    const { data } = await this.supabase.client.auth.getSession();
    this._session.set(data.session);
    this._initialized.set(true);
  }

  async signIn(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw new Error(error.message);
    }
    this._session.set(data.session);
  }

  async signOut(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this._session.set(null);
  }

  /**
   * Verifica que el usuario autenticado tenga rol admin usando la función
   * `is_admin()` (SECURITY DEFINER) del backend.
   */
  async isAdmin(): Promise<boolean> {
    await this.ready;
    if (!this._session()) {
      return false;
    }
    const { data, error } = await this.supabase.client.rpc('is_admin');
    if (error) {
      return false;
    }
    return data === true;
  }
}
