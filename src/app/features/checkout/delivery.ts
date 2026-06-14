import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { OrderStateService } from '../../core/services/order-state.service';
import { ShippingService } from '../../core/services/shipping.service';
import { CopPipe } from '../../shared/pipes/cop.pipe';
import { FlowHeader } from '../../shared/components/flow-header/flow-header';
import { DatePicker } from '../../shared/components/date-picker/date-picker';
import { TimePicker } from '../../shared/components/time-picker/time-picker';
import { WhatsappButton } from '../../shared/components/whatsapp-button/whatsapp-button';
import { whatsappDeliveryMessage } from '../../shared/utils/whatsapp-messages';

@Component({
  selector: 'app-delivery',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    CopPipe,
    FlowHeader,
    DatePicker,
    TimePicker,
    WhatsappButton,
  ],
  template: `
    <app-flow-header title="Información de entrega" />

    <form
      [formGroup]="form"
      (ngSubmit)="submit()"
      autocomplete="off"
      class="px-4 pb-44 pt-2"
    >
      <h2 class="mb-4 text-base font-semibold text-gray-800">
        3. Datos de entrega
      </h2>

      <div class="space-y-4">
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-gray-500">
            Nombre completo
          </span>
          <input
            type="text"
            formControlName="customerName"
            placeholder="María López"
            autocomplete="off"
            class="w-full rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <label class="block">
          <span class="mb-1 block text-xs font-medium text-gray-500">
            Teléfono / WhatsApp
          </span>
          <input
            type="tel"
            formControlName="customerPhone"
            placeholder="300 123 4567"
            autocomplete="off"
            class="w-full rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <label class="block">
          <span class="mb-1 block text-xs font-medium text-gray-500">
            Dirección de entrega
          </span>
          <input
            type="text"
            formControlName="address"
            placeholder="Ej: Barrio El Carmen, Malambo"
            autocomplete="off"
            class="w-full rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          @if (shippingLoading()) {
            <p class="mt-1 text-[11px] text-gray-400">Calculando domicilio...</p>
          } @else if (orderState.shippingLabel()) {
            <p
              class="mt-1 text-[11px] font-medium"
              [class.text-brand-600]="orderState.shippingCost() === 0"
              [class.text-gray-500]="orderState.shippingCost() > 0"
            >
              {{ orderState.shippingLabel() }}
            </p>
          }
        </label>

        <div class="grid grid-cols-2 gap-3">
          <div class="relative">
            <span class="mb-1 block text-xs font-medium text-gray-500">
              Fecha de entrega
            </span>
            <app-date-picker formControlName="deliveryDate" />
          </div>
          <div class="relative">
            <span class="mb-1 block text-xs font-medium text-gray-500">
              Hora aproximada
            </span>
            <app-time-picker
              formControlName="deliveryTime"
              [minDate]="selectedDate()"
            />
          </div>
        </div>

        <label class="block">
          <span class="mb-1 block text-xs font-medium text-gray-500">
            Observaciones (opcional)
          </span>
          <textarea
            formControlName="notes"
            rows="2"
            placeholder="Punto de referencia, color de la casa..."
            autocomplete="off"
            class="w-full rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          ></textarea>
        </label>
      </div>
    </form>

    <footer
      class="fixed inset-x-0 bottom-0 space-y-3 border-t border-cream-200 bg-cream-50/95 p-4 backdrop-blur"
    >
      <app-whatsapp-button
        class="absolute bottom-full right-4 mb-3"
        variant="icon"
        [message]="whatsappMessage()"
      />
      <div class="space-y-1 text-sm">
        <div class="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span class="font-medium">{{ orderState.subtotal() | cop }}</span>
        </div>
        <div class="flex justify-between gap-3 text-gray-600">
          <span class="min-w-0">
            Domicilio
            <span class="block text-[10px] font-normal text-gray-400">
              {{ orderState.shippingLabel() }}
            </span>
          </span>
          <span class="shrink-0 font-medium">{{ orderState.shippingCost() | cop }}</span>
        </div>
        <div class="flex justify-between text-base font-bold text-gray-900">
          <span>Total</span>
          <span>{{ orderState.total() | cop }}</span>
        </div>
      </div>
      <button
        type="button"
        [disabled]="form.invalid"
        (click)="submit()"
        class="w-full rounded-xl bg-brand-500 py-3.5 text-sm font-semibold text-white shadow-md transition enabled:hover:bg-brand-600 disabled:opacity-40"
      >
        Continuar
      </button>
    </footer>
  `,
})
export class Delivery implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly shippingService = inject(ShippingService);
  protected readonly orderState = inject(OrderStateService);

  readonly selectedDate = signal('');
  readonly shippingLoading = signal(false);

  readonly form = this.fb.nonNullable.group({
    customerName: ['', [Validators.required, Validators.minLength(3)]],
    customerPhone: ['', [Validators.required, Validators.minLength(7)]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    deliveryDate: ['', Validators.required],
    deliveryTime: ['', Validators.required],
    notes: [''],
  });

  constructor() {
    this.form.controls.deliveryDate.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((date) => {
        this.selectedDate.set(date);
        this.form.controls.deliveryTime.updateValueAndValidity();
      });

    this.form.controls.address.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((address) => {
        void this.updateShipping(address);
      });
  }

  ngOnInit(): void {
    if (!this.orderState.hasItems()) {
      this.router.navigate(['/']);
      return;
    }
    const existing = this.orderState.delivery();
    if (existing) {
      this.form.patchValue(existing);
      void this.updateShipping(existing.address);
    } else {
      this.orderState.setShipping(0, 'Ingresa la dirección');
    }
  }

  private async updateShipping(address: string): Promise<void> {
    const trimmed = address.trim();
    if (trimmed.length < 5) {
      this.orderState.setShipping(0, 'Ingresa la dirección');
      return;
    }

    this.shippingLoading.set(true);
    try {
      const quote = await this.shippingService.estimate(trimmed);
      this.orderState.setShipping(quote.cost, quote.label);
    } catch {
      this.orderState.setShipping(0, 'No se pudo estimar el domicilio');
    } finally {
      this.shippingLoading.set(false);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.orderState.setDelivery(this.form.getRawValue());
    this.router.navigate(['/pago']);
  }

  whatsappMessage(): string {
    return whatsappDeliveryMessage(this.form.controls.customerName.value);
  }
}
