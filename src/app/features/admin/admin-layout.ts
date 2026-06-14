import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { AdminOrderNotifyService } from '../../core/services/admin-order-notify.service';
import { PwaInstall } from '../../shared/components/pwa-install/pwa-install';
import { AdminOrderAlert } from '../../shared/components/admin-order-alert/admin-order-alert';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-admin-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, PwaInstall, AdminOrderAlert],
  template: `
    <div class="flex min-h-screen bg-cream-100">
      @if (menuOpen()) {
        <div
          class="fixed inset-0 z-20 bg-black/40 lg:hidden"
          (click)="menuOpen.set(false)"
          aria-hidden="true"
        ></div>
      }
      <aside
        class="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-brand-600 text-white transition-transform lg:translate-x-0"
        [class.-translate-x-full]="!menuOpen()"
        [class.translate-x-0]="menuOpen()"
      >
        <div class="px-5 py-5">
          <span class="font-brand text-2xl text-accent-400">DeliPasabocas</span>
        </div>
        <nav class="flex-1 space-y-1 px-3">
          @for (item of nav; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-brand-500 text-white"
              [routerLinkActiveOptions]="{ exact: false }"
              (click)="menuOpen.set(false)"
              class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-100 transition hover:bg-brand-500 hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                class="h-5 w-5 shrink-0"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                @switch (item.icon) {
                  @case ('dashboard') {
                    <rect x="3" y="3" width="7" height="9" rx="1" />
                    <rect x="14" y="3" width="7" height="5" rx="1" />
                    <rect x="14" y="12" width="7" height="9" rx="1" />
                    <rect x="3" y="16" width="7" height="5" rx="1" />
                  }
                  @case ('orders') {
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" />
                    <path d="M9 12h6M9 16h6" />
                  }
                  @case ('products') {
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                    <path d="m3.3 7 8.7 5 8.7-5" />
                    <path d="M12 22V12" />
                  }
                  @case ('settings') {
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                  }
                }
              </svg>
              {{ item.label }}
            </a>
          }
        </nav>
        <button
          type="button"
          (click)="logout()"
          class="m-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-brand-100 transition hover:bg-brand-500 hover:text-white"
        >
          <svg
            viewBox="0 0 24 24"
            class="h-5 w-5 shrink-0"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          Cerrar sesión
        </button>
      </aside>

      <div class="flex min-h-screen flex-1 flex-col lg:ml-60">
        <header
          class="sticky top-0 z-10 flex items-center justify-between border-b border-cream-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6"
        >
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="toggleMenu()"
              class="rounded-lg p-2 text-gray-600 transition hover:bg-cream-100 lg:hidden"
              aria-label="Menú"
            >
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span class="text-sm font-semibold text-gray-700">Panel administrativo</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <span class="hidden sm:inline">Admin</span>
            <a
              routerLink="/admin/configuracion"
              aria-label="Configuración"
              class="grid h-8 w-8 place-items-center rounded-full bg-brand-100 font-semibold text-brand-600 transition hover:bg-brand-200"
            >
              A
            </a>
          </div>
        </header>

        <main class="flex-1 p-4 sm:p-6">
          <div class="mx-auto w-full max-w-6xl">
            <router-outlet />
          </div>
        </main>
      </div>
      <app-admin-order-alert />
      <app-pwa-install />
    </div>
  `,
})
export class AdminLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly orderNotify = inject(AdminOrderNotifyService);
  private readonly destroyRef = inject(DestroyRef);

  readonly menuOpen = signal(false);

  constructor() {
    this.orderNotify.ensureListening();
    this.destroyRef.onDestroy(() => this.orderNotify.stopListening());
  }

  readonly nav: NavItem[] = [
    { label: 'Dashboard', path: 'dashboard', icon: 'dashboard' },
    { label: 'Pedidos', path: 'pedidos', icon: 'orders' },
    { label: 'Productos', path: 'productos', icon: 'products' },
    { label: 'Configuración', path: 'configuracion', icon: 'settings' },
  ];

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate(['/admin/login']);
  }
}
