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

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="grid min-h-screen place-items-center bg-cream-100 px-4">
      <div class="w-full max-w-sm">
        <div class="mb-6 text-center">
          <span class="font-brand text-3xl text-accent-600">DeliPasabocas</span>
          <p class="mt-1 text-sm text-gray-500">Panel administrativo</p>
        </div>

        <form
          [formGroup]="form"
          (ngSubmit)="submit()"
          class="space-y-4 rounded-2xl border border-cream-200 bg-white p-6 shadow-sm"
        >
          <label class="block">
            <span class="mb-1 block text-xs font-medium text-gray-500">
              Correo
            </span>
            <input
              type="email"
              formControlName="email"
              autocomplete="username"
              placeholder="admin@delipasabocas.com"
              class="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </label>

          <label class="block">
            <span class="mb-1 block text-xs font-medium text-gray-500">
              Contraseña
            </span>
            <input
              type="password"
              formControlName="password"
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </label>

          @if (error()) {
            <p class="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {{ error() }}
            </p>
          }

          <button
            type="submit"
            [disabled]="form.invalid || loading()"
            class="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-md transition enabled:hover:bg-brand-600 disabled:opacity-40"
          >
            {{ loading() ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

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
