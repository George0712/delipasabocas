import { DestroyRef, inject, Injectable, isDevMode } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

const MANIFEST_ID = 'admin-manifest-link';
const APPLE_TOUCH_ID = 'admin-apple-touch-icon';
const ADMIN_MANIFEST = '/admin-manifest.webmanifest';

/**
 * Activa la PWA solo en rutas /admin: manifest + service worker.
 * En el sitio cliente no se ofrece instalación.
 */
@Injectable({ providedIn: 'root' })
export class AdminPwaService {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private enabled = false;

  constructor() {
    this.sync(this.router.url);

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.sync((event as NavigationEnd).urlAfterRedirects);
      });
  }

  private sync(url: string): void {
    if (url.startsWith('/admin')) {
      void this.enable();
    } else {
      void this.disable();
    }
  }

  private async enable(): Promise<void> {
    if (this.enabled) {
      return;
    }
    this.enabled = true;
    this.attachManifest();
    this.attachAppleTouchIcon();
    await this.registerServiceWorker();
  }

  private async disable(): Promise<void> {
    if (!this.enabled) {
      return;
    }
    this.enabled = false;
    this.detachManifest();
    await this.unregisterServiceWorker();
  }

  private attachManifest(): void {
    if (document.getElementById(MANIFEST_ID)) {
      return;
    }

    const link = document.createElement('link');
    link.id = MANIFEST_ID;
    link.rel = 'manifest';
    link.href = ADMIN_MANIFEST;
    document.head.appendChild(link);
  }

  private detachManifest(): void {
    document.getElementById(MANIFEST_ID)?.remove();
    document.getElementById(APPLE_TOUCH_ID)?.remove();
  }

  private attachAppleTouchIcon(): void {
    if (document.getElementById(APPLE_TOUCH_ID)) {
      return;
    }

    const link = document.createElement('link');
    link.id = APPLE_TOUCH_ID;
    link.rel = 'apple-touch-icon';
    link.href = '/icons/icon-192x192.png';
    document.head.appendChild(link);
  }

  private async registerServiceWorker(): Promise<void> {
    if (isDevMode() || !('serviceWorker' in navigator)) {
      return;
    }

    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) {
      return;
    }

    try {
      await navigator.serviceWorker.register('/ngsw-worker.js');
    } catch (error) {
      console.warn('No se pudo registrar el service worker del admin', error);
    }
  }

  private async unregisterServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    await registration?.unregister();
  }
}
