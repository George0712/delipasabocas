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
    <div class="app-shell app-page">
    <app-flow-header title="Información de entrega" />

    <form
      [formGroup]="form"
      (ngSubmit)="submit()"
      autocomplete="off"
      class="px-4 pb-44 pt-2"
    >
      <h2 class="app-heading mb-4">3. Datos de entrega</h2>

      <div class="space-y-4">
        <label class="block">
          <span class="app-label">Nombre completo</span>
          <input type="text" formControlName="customerName" placeholder="María López" autocomplete="off" class="app-input" />
        </label>

        <label class="block">
          <span class="app-label">Teléfono / WhatsApp</span>
          <input type="tel" formControlName="customerPhone" placeholder="300 123 4567" autocomplete="off" class="app-input" />
        </label>

        <label class="block">
          <span class="app-label">Dirección de entrega</span>
          <input type="text" formControlName="address" placeholder="Ej: Barrio El Carmen, Malambo" autocomplete="off" class="app-input" />
          @if (shippingLoading()) {
            <p class="app-text-muted mt-1 text-[11px]">Calculando domicilio...</p>
          } @else if (orderState.shippingLabel()) {
            <p class="mt-1 text-[11px] font-medium" [class.text-[var(--app-primary)]]="orderState.shippingCost() === 0" [class.app-text-muted]="orderState.shippingCost() > 0">
              {{ orderState.shippingLabel() }}
            </p>
          }
        </label>

        <div class="grid grid-cols-2 gap-3">
          <div class="relative">
            <span class="app-label">Fecha de entrega</span>
            <app-date-picker formControlName="deliveryDate" />
          </div>
          <div class="relative">
            <span class="app-label">Hora aproximada</span>
            <app-time-picker formControlName="deliveryTime" [minDate]="selectedDate()" />
          </div>
        </div>

        <label class="block">
          <span class="app-label">Observaciones (opcional)</span>
          <textarea formControlName="notes" rows="2" placeholder="Punto de referencia, color de la casa..." autocomplete="off" class="app-input"></textarea>
        </label>
      </div>
    </form>

    <footer class="app-footer-bar">
      <app-whatsapp-button class="absolute bottom-full right-4 mb-3" variant="icon" [message]="whatsappMessage()" />
      <div class="space-y-1 text-sm">
        <div class="app-text-secondary flex justify-between">
          <span>Subtotal</span>
          <span class="font-medium">{{ orderState.subtotal() | cop }}</span>
        </div>
        <div class="app-text-secondary flex justify-between gap-3">
          <span class="min-w-0">
            Domicilio
            <span class="app-text-muted block text-[10px] font-normal">{{ orderState.shippingLabel() }}</span>
          </span>
          <span class="shrink-0 font-medium">{{ orderState.shippingCost() | cop }}</span>
        </div>
        <div class="app-text flex justify-between text-base font-bold">
          <span>Total</span>
          <span>{{ orderState.total() | cop }}</span>
        </div>
      </div>
      <button type="button" [disabled]="form.invalid" (click)="submit()" class="app-btn-primary w-full">Continuar</button>
    </footer>
    </div>
  `,})
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
