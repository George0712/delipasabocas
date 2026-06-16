import { Injectable, signal } from '@angular/core';

export type AdminTheme = 'light' | 'dark';

const STORAGE_KEY = 'dp-admin-theme';

@Injectable({ providedIn: 'root' })
export class AdminThemeService {
  readonly theme = signal<AdminTheme>(this.readStored());

  setTheme(theme: AdminTheme): void {
    this.theme.set(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  toggle(): void {
    this.setTheme(this.theme() === 'light' ? 'dark' : 'light');
  }

  private readStored(): AdminTheme {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  }
}
