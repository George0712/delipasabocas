import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { environment } from '../../../../environments/environment';
import { BusinessSettingsService } from '../../../core/services/business-settings.service';

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="mb-5">
      <h1 class="text-2xl font-bold text-gray-900">Configuración</h1>
      <p class="mt-0.5 text-sm text-gray-500">
        Datos de contacto y pago visibles para tus clientes.
      </p>
    </div>

    @if (loading()) {
      <p class="text-sm text-gray-400">Cargando...</p>
    } @else {
      <form
        [formGroup]="form"
        (ngSubmit)="save()"
        class="max-w-lg space-y-5 rounded-2xl border border-cream-200 bg-white p-5 shadow-sm"
      >
        <div>
          <p class="text-xs uppercase tracking-wide text-gray-400">Negocio</p>
          <p class="text-sm font-semibold text-gray-800">{{ businessName }}</p>
          <p class="text-sm text-gray-500">{{ businessCity }}</p>
        </div>

        <div class="space-y-4 border-t border-cream-100 pt-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Contacto
          </p>

          <label class="block space-y-1.5">
            <span class="text-sm font-medium text-gray-700">
              Número de WhatsApp
            </span>
            <input
              type="tel"
              formControlName="whatsappNumber"
              placeholder="573001234567"
              class="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <span class="text-xs text-gray-400">
              Código de país + celular, sin espacios ni el signo +.
            </span>
          </label>
        </div>

        <div class="space-y-4 border-t border-cream-100 pt-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Pagos
          </p>

          <label class="block space-y-1.5">
            <span class="text-sm font-medium text-gray-700">Número Nequi</span>
            <input
              type="tel"
              formControlName="nequi"
              placeholder="3001234567"
              class="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </label>

          <label class="block space-y-1.5">
            <span class="text-sm font-medium text-gray-700">
              Cuenta Bancolombia (ahorros)
            </span>
            <input
              type="text"
              formControlName="bancolombiaAccount"
              placeholder="123 456 78910"
              class="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </label>

          <label class="block space-y-1.5">
            <span class="text-sm font-medium text-gray-700">
              Titular de la cuenta
            </span>
            <input
              type="text"
              formControlName="bancolombiaHolder"
              placeholder="Deli Pasabocas"
              class="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </label>
        </div>

        @if (success()) {
          <p class="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
            {{ success() }}
          </p>
        }
        @if (error()) {
          <p class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {{ error() }}
          </p>
        }

        <button
          type="submit"
          [disabled]="form.invalid || saving()"
          class="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-md transition enabled:hover:bg-brand-600 disabled:opacity-40"
        >
          {{ saving() ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </form>
    }
  `,
})
export class Settings implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(BusinessSettingsService);

  readonly businessName = environment.business.name;
  readonly businessCity = environment.business.city;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly success = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    whatsappNumber: ['', [Validators.required, Validators.minLength(10)]],
    nequi: ['', [Validators.required, Validators.minLength(10)]],
    bancolombiaAccount: ['', Validators.required],
    bancolombiaHolder: ['', Validators.required],
  });

  async ngOnInit(): Promise<void> {
    try {
      const settings = await this.settingsService.get();
      this.form.patchValue({
        whatsappNumber: settings.whatsappNumber || environment.whatsappNumber,
        nequi: settings.nequi,
        bancolombiaAccount: settings.bancolombiaAccount,
        bancolombiaHolder: settings.bancolombiaHolder,
      });
    } catch {
      this.form.patchValue({
        whatsappNumber: environment.whatsappNumber,
        nequi: environment.business.nequi,
        bancolombiaAccount: environment.business.bancolombiaAccount,
        bancolombiaHolder: environment.business.bancolombiaHolder,
      });
      this.error.set('No se pudo cargar la configuración. Se muestran valores por defecto.');
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const ok = confirm(
      '¿Guardar los cambios en WhatsApp, Nequi y Bancolombia? Los clientes verán estos datos al hacer pedidos.',
    );
    if (!ok) {
      return;
    }

    this.saving.set(true);
    this.success.set(null);
    this.error.set(null);

    try {
      await this.settingsService.save(this.form.getRawValue());
      this.success.set('Configuración guardada correctamente.');
    } catch {
      this.error.set('No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      this.saving.set(false);
    }
  }
}
