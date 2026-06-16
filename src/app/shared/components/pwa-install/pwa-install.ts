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
      <div class="adm-modal adm-card fixed inset-x-4 bottom-4 z-40 p-4 sm:inset-x-auto sm:right-4 sm:max-w-sm">
        <p class="adm-text text-sm font-semibold">Instala el panel admin</p>
        <p class="adm-text-muted mt-1 text-xs">
          Agrégalo a tu pantalla de inicio para gestionar pedidos como una app.
        </p>
        <div class="mt-3 flex gap-2">
          <button type="button" (click)="install()" class="adm-btn-primary flex-1">
            Instalar
          </button>
          <button type="button" (click)="dismiss()" class="adm-btn-ghost">
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

