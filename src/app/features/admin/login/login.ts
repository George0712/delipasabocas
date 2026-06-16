import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { AdminThemeService } from '../../../core/services/admin-theme.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="admin-shell grid min-h-screen place-items-center px-4" [attr.data-theme]="theme.theme()">
      <div class="adm-page w-full max-w-sm">
        <div class="mb-8 text-center">
          <span class="font-brand text-3xl text-[var(--adm-primary-soft)]">DeliPasabocas</span>
          <p class="adm-subheading mt-2">Panel administrativo</p>
        </div>

        <form
          [formGroup]="form"
          (ngSubmit)="submit()"
          class="adm-card space-y-4 p-6"
        >
          <label class="block">
            <span class="adm-label">Correo</span>
            <input
              type="email"
              formControlName="email"
              autocomplete="username"
              placeholder="admin@delipasabocas.com"
              class="adm-input"
            />
          </label>

          <label class="block">
            <span class="adm-label">Contraseña</span>
            <input
              type="password"
              formControlName="password"
              autocomplete="current-password"
              placeholder="••••••••"
              class="adm-input"
            />
          </label>

          @if (error()) {
            <p class="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-500">
              {{ error() }}
            </p>
          }

          <button
            type="submit"
            [disabled]="form.invalid || loading()"
            class="adm-btn-primary w-full py-3"
          >
            {{ loading() ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>

        <div class="mt-4 flex justify-center">
          <button
            type="button"
            (click)="theme.toggle()"
            class="adm-btn-ghost"
            [attr.aria-label]="theme.theme() === 'light' ? 'Modo oscuro' : 'Modo claro'"
          >
            {{ theme.theme() === 'light' ? 'Modo oscuro' : 'Modo claro' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly theme = inject(AdminThemeService);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();

    try {
      await this.auth.signIn(email, password);
      const isAdmin = await this.auth.isAdmin();
      if (!isAdmin) {
        await this.auth.signOut();
        this.error.set('Esta cuenta no tiene permisos de administrador.');
        return;
      }
      this.router.navigate(['/admin/dashboard']);
    } catch {
      this.error.set('Credenciales incorrectas. Inténtalo de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }
}
