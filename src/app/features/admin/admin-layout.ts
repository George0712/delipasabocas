import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
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
import { AdminThemeService } from '../../core/services/admin-theme.service';
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
    <div class="admin-shell flex min-h-screen" [attr.data-theme]="theme.theme()">
      @if (menuOpen()) {
        <div
          class="fixed inset-0 z-20 lg:hidden"
          [style.background]="'var(--adm-overlay)'"
          (click)="closeMenu()"
          aria-hidden="true"
        ></div>
      }

      <aside
        #sidebar
        class="adm-sidebar fixed inset-y-0 left-0 z-30 flex w-64 touch-pan-y flex-col border-r"
        [class.adm-sidebar-dragging]="sidebarDragging()"
        [style.background]="'var(--adm-sidebar)'"
        [style.border-color]="'var(--adm-sidebar-border)'"
        [style.transform]="sidebarTransform()"
        (pointerdown)="onSidebarPointerDown($event)"
        (pointermove)="onSidebarPointerMove($event)"
        (pointerup)="onSidebarPointerEnd()"
        (pointercancel)="onSidebarPointerEnd()"
      >
        <div class="border-b px-6 py-6" [style.border-color]="'var(--adm-sidebar-border)'">
          <span class="font-brand text-2xl text-[var(--adm-primary-soft)]">DeliPasabocas</span>
          <p class="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
            Admin Console
          </p>
        </div>

        <nav class="flex-1 space-y-1 px-3 py-4">
          @for (item of nav; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="adm-nav-link-active"
              [routerLinkActiveOptions]="{ exact: false }"
              (click)="closeMenu()"
              class="adm-nav-link"
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
          class="adm-nav-link m-3"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          Cerrar sesión
        </button>
      </aside>

      <div class="flex min-h-screen flex-1 flex-col lg:ml-64">
        <header
          class="sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 backdrop-blur-md sm:px-6"
          [style.background]="'var(--adm-header)'"
          [style.border-color]="'var(--adm-border)'"
        >
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="toggleMenu()"
              class="rounded-lg p-2 transition lg:hidden"
              [style.color]="'var(--adm-text-secondary)'"
              aria-label="Menú"
            >
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span class="text-sm font-semibold" [style.color]="'var(--adm-text-secondary)'">
              Panel administrativo
            </span>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="theme.toggle()"
              class="grid h-9 w-9 place-items-center rounded-xl border transition active:scale-95"
              [style.border-color]="'var(--adm-border)'"
              [style.background]="'var(--adm-surface)'"
              [style.color]="'var(--adm-text-secondary)'"
              [attr.aria-label]="theme.theme() === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'"
            >
              @if (theme.theme() === 'light') {
                <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              } @else {
                <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke-linecap="round" />
                </svg>
              }
            </button>

            <a
              routerLink="/admin/configuracion"
              aria-label="Configuración"
              class="grid h-9 w-9 place-items-center rounded-xl text-sm font-bold text-white transition active:scale-95"
              [style.background]="'var(--adm-primary)'"
            >
              A
            </a>
          </div>
        </header>

        <main class="flex-1 p-4 sm:p-6">
          <div class="adm-page mx-auto w-full max-w-6xl">
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

  readonly theme = inject(AdminThemeService);
  readonly menuOpen = signal(false);
  readonly sidebarDrag = signal(0);
  readonly sidebarDragging = signal(false);

  private readonly sidebarWidth = 256;
  private sidebarPointerId: number | null = null;
  private sidebarStartX = 0;
  private sidebarActive = false;

  readonly sidebarTransform = computed(() => {
    if (!this.menuOpen()) {
      return 'translateX(-100%)';
    }
    return `translateX(${this.sidebarDrag()}px)`;
  });

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
    this.sidebarDrag.set(0);
    this.sidebarDragging.set(false);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
    this.sidebarDrag.set(0);
    this.sidebarDragging.set(false);
    this.sidebarActive = false;
    this.sidebarPointerId = null;
  }

  onSidebarPointerDown(ev: PointerEvent): void {
    if (!this.menuOpen() || !this.isMobileViewport() || ev.button !== 0) {
      return;
    }
    this.sidebarActive = true;
    this.sidebarDragging.set(false);
    this.sidebarStartX = ev.clientX;
    this.sidebarPointerId = ev.pointerId;
    (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
  }

  onSidebarPointerMove(ev: PointerEvent): void {
    if (!this.sidebarActive || this.sidebarPointerId !== ev.pointerId) {
      return;
    }
    const delta = ev.clientX - this.sidebarStartX;
    if (!this.sidebarDragging() && Math.abs(delta) < 8) {
      return;
    }
    this.sidebarDragging.set(true);
    this.sidebarDrag.set(Math.min(0, Math.max(-this.sidebarWidth, delta)));
  }

  onSidebarPointerEnd(): void {
    if (!this.sidebarActive) {
      return;
    }
    this.sidebarActive = false;
    this.sidebarPointerId = null;

    if (this.sidebarDragging()) {
      const shouldClose = this.sidebarDrag() < -this.sidebarWidth * 0.28;
      if (shouldClose) {
        this.closeMenu();
        return;
      }
      this.sidebarDrag.set(0);
    }

    this.sidebarDragging.set(false);
  }

  private isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 1024;
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate(['/admin/login']);
  }
}
