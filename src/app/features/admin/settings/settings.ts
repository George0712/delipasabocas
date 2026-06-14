import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { environment } from '../../../../environments/environment';
import {
  SETTINGS_SECTIONS,
  SettingsSectionId,
} from '../../../core/models/business-settings.model';
import { BusinessSettingsService } from '../../../core/services/business-settings.service';

const inputClass =
  'w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="mb-5">
      <h1 class="text-2xl font-bold text-gray-900">Configuración</h1>
      <p class="mt-0.5 text-sm text-gray-500">
        Ajustes del negocio organizados por sección.
      </p>
    </div>

    @if (loading()) {
      <p class="text-sm text-gray-400">Cargando...</p>
    } @else {
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start">
        <nav
          class="flex gap-2 overflow-x-auto rounded-2xl border border-cream-200 bg-white p-2 shadow-sm lg:w-56 lg:flex-col lg:overflow-visible"
          aria-label="Secciones de configuración"
        >
          @for (section of sections; track section.id) {
            <button
              type="button"
              (click)="activeSection.set(section.id)"
              class="shrink-0 rounded-xl px-3 py-2.5 text-left transition lg:w-full"
              [class.bg-brand-500]="activeSection() === section.id"
              [class.text-white]="activeSection() === section.id"
              [class.text-gray-600]="activeSection() !== section.id"
              [class.hover:bg-cream-50]="activeSection() !== section.id"
            >
              <span class="block text-sm font-semibold">{{ section.label }}</span>
              <span
                class="mt-0.5 hidden text-[11px] lg:block"
                [class.text-brand-100]="activeSection() === section.id"
                [class.text-gray-400]="activeSection() !== section.id"
              >
                {{ section.description }}
              </span>
            </button>
          }
        </nav>

        <form
          [formGroup]="form"
          (ngSubmit)="save()"
          class="min-w-0 flex-1 rounded-2xl border border-cream-200 bg-white shadow-sm"
        >
          <div class="border-b border-cream-100 px-5 py-4">
            <h2 class="text-base font-bold text-gray-900">{{ activeMeta().label }}</h2>
            <p class="mt-0.5 text-sm text-gray-500">{{ activeMeta().description }}</p>
          </div>

          <div class="space-y-4 p-5">
            @switch (activeSection()) {
              @case ('general') {
                <div class="rounded-xl bg-cream-50 px-4 py-3">
                  <p class="text-xs uppercase tracking-wide text-gray-400">Negocio</p>
                  <p class="mt-1 text-sm font-semibold text-gray-800">{{ businessName }}</p>
                  <p class="text-sm text-gray-500">{{ businessCity }}</p>
                </div>
                <p class="text-sm text-gray-500">
                  Nombre y ciudad se definen en el despliegue de la app. Aquí podrás
                  agregar más opciones generales en futuras versiones (horarios,
                  pedido mínimo, mensajes automáticos, etc.).
                </p>
              }

              @case ('contact') {
                <div formGroupName="contact">
                  <label class="block space-y-1.5">
                    <span class="text-sm font-medium text-gray-700">Número de WhatsApp</span>
                    <input
                      type="tel"
                      formControlName="whatsappNumber"
                      placeholder="573001234567"
                      [class]="inputClass"
                    />
                    <span class="text-xs text-gray-400">
                      Código de país + celular, sin espacios ni el signo +.
                    </span>
                  </label>
                </div>
              }

              @case ('payments') {
                <div formGroupName="payments" class="space-y-4">
                  <label class="block space-y-1.5">
                    <span class="text-sm font-medium text-gray-700">Número Nequi</span>
                    <input type="tel" formControlName="nequi" placeholder="3001234567" [class]="inputClass" />
                  </label>
                  <label class="block space-y-1.5">
                    <span class="text-sm font-medium text-gray-700">Cuenta Bancolombia (ahorros)</span>
                    <input
                      type="text"
                      formControlName="bancolombiaAccount"
                      placeholder="123 456 78910"
                      [class]="inputClass"
                    />
                  </label>
                  <label class="block space-y-1.5">
                    <span class="text-sm font-medium text-gray-700">Titular de la cuenta</span>
                    <input
                      type="text"
                      formControlName="bancolombiaHolder"
                      placeholder="Deli Pasabocas"
                      [class]="inputClass"
                    />
                  </label>
                  <p class="text-xs text-gray-400">
                    El código QR de Nequi se actualiza subiendo la imagen en
                    <code class="rounded bg-cream-100 px-1">public/nequi-qr2.jpeg</code>.
                  </p>
                </div>
              }

              @case ('shipping') {
                <div formGroupName="shipping" class="space-y-4">
                  <div formGroupName="origin" class="space-y-4 rounded-xl border border-cream-100 bg-cream-50/50 p-4">
                    <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Punto de producción
                    </p>
                    <label class="block space-y-1.5">
                      <span class="text-sm font-medium text-gray-700">Nombre del lugar</span>
                      <input
                        type="text"
                        formControlName="label"
                        placeholder="DeliPasabocas, Malambo"
                        [class]="inputClass"
                      />
                    </label>
                    <div class="grid grid-cols-2 gap-3">
                      <label class="block space-y-1.5">
                        <span class="text-sm font-medium text-gray-700">Latitud</span>
                        <input type="number" step="0.000001" formControlName="lat" [class]="inputClass" />
                      </label>
                      <label class="block space-y-1.5">
                        <span class="text-sm font-medium text-gray-700">Longitud</span>
                        <input type="number" step="0.000001" formControlName="lng" [class]="inputClass" />
                      </label>
                    </div>
                    <p class="text-xs text-gray-400">
                      Usa Google Maps: clic derecho en tu cocina → copiar coordenadas.
                    </p>
                  </div>

                  <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Tarifas de domicilio
                  </p>
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label class="block space-y-1.5">
                      <span class="text-sm font-medium text-gray-700">Radio gratis (km)</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        formControlName="freeRadiusKm"
                        [class]="inputClass"
                      />
                      <span class="text-xs text-gray-400">Malambo y alrededores cercanos.</span>
                    </label>
                    <label class="block space-y-1.5">
                      <span class="text-sm font-medium text-gray-700">Referencia Malambo (COP)</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        formControlName="malamboReferenceCost"
                        [class]="inputClass"
                      />
                      <span class="text-xs text-gray-400">Base típica 3.000 – 4.000.</span>
                    </label>
                    <label class="block space-y-1.5">
                      <span class="text-sm font-medium text-gray-700">Cobro por km extra (COP)</span>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        formControlName="perKmBeyondFree"
                        [class]="inputClass"
                      />
                    </label>
                    <label class="block space-y-1.5">
                      <span class="text-sm font-medium text-gray-700">Tope máximo (COP)</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        formControlName="maxCost"
                        [class]="inputClass"
                      />
                    </label>
                    <label class="block space-y-1.5 sm:col-span-2">
                      <span class="text-sm font-medium text-gray-700">Redondeo (COP)</span>
                      <input
                        type="number"
                        min="100"
                        step="100"
                        formControlName="roundTo"
                        [class]="inputClass"
                      />
                      <span class="text-xs text-gray-400">Ej. 500 redondea a $10.500, $11.000...</span>
                    </label>
                  </div>
                </div>
              }
            }

            @if (success()) {
              <p class="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{{ success() }}</p>
            }
            @if (error()) {
              <p class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{{ error() }}</p>
            }
          </div>

          <div class="border-t border-cream-100 px-5 py-4">
            <button
              type="submit"
              [disabled]="form.invalid || saving()"
              class="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-md transition enabled:hover:bg-brand-600 disabled:opacity-40 sm:w-auto sm:px-8"
            >
              {{ saving() ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>
        </form>
      </div>
    }
  `,
})
export class Settings implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(BusinessSettingsService);

  readonly sections = SETTINGS_SECTIONS;
  readonly inputClass = inputClass;
  readonly businessName = environment.business.name;
  readonly businessCity = environment.business.city;

  readonly activeSection = signal<SettingsSectionId>('general');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly success = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  readonly activeMeta = computed(
    () => this.sections.find((s) => s.id === this.activeSection()) ?? this.sections[0],
  );

  readonly form = this.fb.nonNullable.group({
    contact: this.fb.nonNullable.group({
      whatsappNumber: ['', [Validators.required, Validators.minLength(10)]],
    }),
    payments: this.fb.nonNullable.group({
      nequi: ['', [Validators.required, Validators.minLength(10)]],
      bancolombiaAccount: ['', Validators.required],
      bancolombiaHolder: ['', Validators.required],
    }),
    shipping: this.fb.nonNullable.group({
      origin: this.fb.nonNullable.group({
        label: ['', Validators.required],
        lat: [0, [Validators.required, Validators.min(-90), Validators.max(90)]],
        lng: [0, [Validators.required, Validators.min(-180), Validators.max(180)]],
      }),
      freeRadiusKm: [0, [Validators.required, Validators.min(0)]],
      malamboReferenceCost: [0, [Validators.required, Validators.min(0)]],
      perKmBeyondFree: [0, [Validators.required, Validators.min(0)]],
      maxCost: [0, [Validators.required, Validators.min(0)]],
      roundTo: [500, [Validators.required, Validators.min(100)]],
    }),
  });

  async ngOnInit(): Promise<void> {
    try {
      this.patchForm(await this.settingsService.get());
    } catch {
      this.patchFormFromEnv();
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
      '¿Guardar los cambios de configuración? Los clientes verán contacto, pagos y domicilio actualizados.',
    );
    if (!ok) {
      return;
    }

    this.saving.set(true);
    this.success.set(null);
    this.error.set(null);

    try {
      const raw = this.form.getRawValue();
      await this.settingsService.save({
        whatsappNumber: raw.contact.whatsappNumber,
        nequi: raw.payments.nequi,
        bancolombiaAccount: raw.payments.bancolombiaAccount,
        bancolombiaHolder: raw.payments.bancolombiaHolder,
        shipping: {
          origin: raw.shipping.origin,
          freeRadiusKm: raw.shipping.freeRadiusKm,
          malamboReferenceCost: raw.shipping.malamboReferenceCost,
          perKmBeyondFree: raw.shipping.perKmBeyondFree,
          maxCost: raw.shipping.maxCost,
          roundTo: raw.shipping.roundTo,
        },
      });
      this.success.set('Configuración guardada correctamente.');
    } catch {
      this.error.set('No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      this.saving.set(false);
    }
  }

  private patchForm(settings: {
    whatsappNumber: string;
    nequi: string;
    bancolombiaAccount: string;
    bancolombiaHolder: string;
    shipping: {
      origin: { lat: number; lng: number; label: string };
      freeRadiusKm: number;
      malamboReferenceCost: number;
      perKmBeyondFree: number;
      maxCost: number;
      roundTo: number;
    };
  } | null): void {
    if (!settings) {
      return;
    }
    this.form.patchValue({
      contact: { whatsappNumber: settings.whatsappNumber },
      payments: {
        nequi: settings.nequi,
        bancolombiaAccount: settings.bancolombiaAccount,
        bancolombiaHolder: settings.bancolombiaHolder,
      },
      shipping: {
        origin: settings.shipping.origin,
        freeRadiusKm: settings.shipping.freeRadiusKm,
        malamboReferenceCost: settings.shipping.malamboReferenceCost,
        perKmBeyondFree: settings.shipping.perKmBeyondFree,
        maxCost: settings.shipping.maxCost,
        roundTo: settings.shipping.roundTo,
      },
    });
  }

  private patchFormFromEnv(): void {
    const s = environment.business.shipping;
    this.form.patchValue({
      contact: { whatsappNumber: environment.whatsappNumber },
      payments: {
        nequi: environment.business.nequi,
        bancolombiaAccount: environment.business.bancolombiaAccount,
        bancolombiaHolder: environment.business.bancolombiaHolder,
      },
      shipping: {
        origin: s.origin,
        freeRadiusKm: s.freeRadiusKm,
        malamboReferenceCost: s.malamboReferenceCost,
        perKmBeyondFree: s.perKmBeyondFree,
        maxCost: s.maxCost,
        roundTo: s.roundTo,
      },
    });
  }
}
