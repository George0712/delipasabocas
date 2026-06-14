import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal,
} from '@angular/core';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Component({
  selector: 'app-pwa-install',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div
        class="fixed inset-x-4 bottom-4 z-40 rounded-2xl border border-cream-200 bg-white p-4 shadow-lg sm:inset-x-auto sm:right-4 sm:max-w-sm"
      >
        <p class="text-sm font-semibold text-gray-900">Instala el panel admin</p>
        <p class="mt-1 text-xs text-gray-500">
          Agrégalo a tu pantalla de inicio para gestionar pedidos como una app.
        </p>
        <div class="mt-3 flex gap-2">
          <button
            type="button"
            (click)="install()"
            class="flex-1 rounded-xl bg-brand-500 py-2.5 text-xs font-semibold text-white"
          >
            Instalar
          </button>
          <button
            type="button"
            (click)="dismiss()"
            class="rounded-xl px-3 py-2.5 text-xs font-medium text-gray-500"
          >
            Ahora no
          </button>
        </div>
      </div>
    }
  `,
})
export class PwaInstall implements OnInit {
  private static readonly DISMISS_KEY = 'admin-pwa-install-dismissed';

  readonly visible = signal(false);

  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  ngOnInit(): void {
    if (this.isStandalone()) {
      return;
    }

    if (localStorage.getItem(PwaInstall.DISMISS_KEY) === '1') {
      return;
    }

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.visible.set(true);
    });
  }

  async install(): Promise<void> {
    const prompt = this.deferredPrompt;
    if (!prompt) {
      return;
    }

    await prompt.prompt();
    const choice = await prompt.userChoice;
    this.deferredPrompt = null;
    this.visible.set(false);

    if (choice.outcome === 'dismissed') {
      localStorage.setItem(PwaInstall.DISMISS_KEY, '1');
    }
  }

  dismiss(): void {
    this.visible.set(false);
    localStorage.setItem(PwaInstall.DISMISS_KEY, '1');
  }

  private isStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone === true)
    );
  }
}
