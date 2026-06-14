import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { OrderItem } from '../../core/models/order.model';
import { Product, productSavings } from '../../core/models/product.model';
import { OrderStateService } from '../../core/services/order-state.service';
import { ProductService } from '../../core/services/product.service';
import { CopPipe } from '../../shared/pipes/cop.pipe';
import { DEFAULT_COMBOS } from '../../shared/data/default-combos';
import { DEFAULT_PRODUCTS } from '../../shared/data/default-products';
import { FlowHeader } from '../../shared/components/flow-header/flow-header';

@Component({
  selector: 'app-custom-order',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CopPipe, FlowHeader],
  template: `
    <app-flow-header title="Pedido personalizado" />

    <main class="px-4 pb-56 pt-2">
      <p class="mb-4 text-sm text-gray-500">
        Combos con pedido mínimo y mejor precio para tu evento.
      </p>

      @if (combos().length > 0) {
        <h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Combos para eventos
        </h2>
        <div class="space-y-3">
          @for (combo of combos(); track combo.id) {
            <div
              class="flex h-full flex-col rounded-2xl border bg-white p-4 shadow-sm transition"
              [class.border-brand-500]="quantityOf(combo.id) > 0"
              [class.ring-2]="quantityOf(combo.id) > 0"
              [class.ring-brand-200]="quantityOf(combo.id) > 0"
              [class.border-cream-200]="quantityOf(combo.id) === 0"
            >
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="text-sm font-bold text-gray-900">{{ combo.name }}</p>
                  @if (savingsOf(combo) > 0) {
                    <span class="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Ahorras {{ savingsOf(combo) | cop }}
                    </span>
                  }
                </div>
                <p class="mt-0.5 text-xs text-gray-500">{{ combo.description }}</p>
                <div class="mt-2 flex items-baseline gap-2">
                  <span class="text-base font-bold text-brand-500">{{ combo.price | cop }}</span>
                  @if (combo.referencePrice && combo.referencePrice > combo.price) {
                    <span class="text-xs text-gray-400 line-through">
                      {{ combo.referencePrice | cop }}
                    </span>
                  }
                </div>
              </div>

              <div class="mt-auto min-h-10 pt-3">
                @if (quantityOf(combo.id) === 0) {
                  <button
                    type="button"
                    (click)="increment(combo.id)"
                    class="flex h-10 w-full items-center justify-center gap-1 rounded-xl border border-brand-200 bg-brand-50 text-sm font-semibold text-brand-600 transition active:scale-95"
                  >
                    Agregar combo
                  </button>
                } @else {
                  <div class="flex h-10 items-center justify-between rounded-xl bg-brand-500 px-1.5 text-white">
                    <button type="button" (click)="decrement(combo.id)" class="grid h-8 w-8 place-items-center rounded-lg bg-white/15">−</button>
                    <span class="text-sm font-bold">{{ quantityOf(combo.id) }}</span>
                    <button type="button" (click)="increment(combo.id)" class="grid h-8 w-8 place-items-center rounded-lg bg-white/15">+</button>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      @if (trays().length > 0) {
        <h2 class="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-gray-400">
          O arma tu pedido
        </h2>
        <div class="space-y-3">
          @for (product of trays(); track product.id) {
            <div class="flex items-center justify-between rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
              <div class="pr-3">
                <p class="text-sm font-semibold text-gray-800">{{ product.name }}</p>
                <p class="text-xs text-gray-500">{{ product.description }}</p>
                <p class="mt-1 text-sm font-bold text-brand-500">{{ product.price | cop }}</p>
              </div>
              <div class="flex items-center gap-3">
                <button type="button" (click)="decrement(product.id)" class="grid h-8 w-8 place-items-center rounded-full border border-cream-200 text-lg text-gray-600">−</button>
                <span class="w-8 text-center text-sm font-semibold">{{ quantityOf(product.id) }}</span>
                <button type="button" (click)="increment(product.id)" class="grid h-8 w-8 place-items-center rounded-full bg-brand-500 text-lg text-white">+</button>
              </div>
            </div>
          }
        </div>
      }
    </main>

    <footer class="fixed inset-x-0 bottom-0 z-20 space-y-3 border-t border-cream-200 bg-cream-50/95 p-4 backdrop-blur">
      @if (totalTrays() > 0) {
        <button
          type="button"
          (click)="toggleFryDirect()"
          class="flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left shadow-md transition active:scale-[0.99]"
          [class.border-amber-400]="fryEnabled()"
          [class.bg-gradient-to-r]="fryEnabled()"
          [class.from-amber-100]="fryEnabled()"
          [class.to-orange-50]="fryEnabled()"
          [class.border-amber-200]="!fryEnabled()"
          [class.bg-white]="!fryEnabled()"
          [class.ring-2]="!fryEnabled()"
          [class.ring-amber-100]="!fryEnabled()"
        >
          <span
            class="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg"
            [class.bg-amber-400]="fryEnabled()"
            [class.text-white]="fryEnabled()"
            [class.bg-amber-50]="!fryEnabled()"
          >
            🔥
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-gray-900">¿Entregar fritas?</p>
            <p class="text-xs text-gray-500">
              {{ fryCostPerTray | cop }}/bandeja · {{ totalTrays() }}
              {{ totalTrays() === 1 ? 'bandeja' : 'bandejas' }}
            </p>
          </div>
          <span
            class="w-[4.5rem] shrink-0 text-right text-xs font-semibold tabular-nums text-amber-700"
            [class.invisible]="!fryEnabled()"
          >
            +{{ potentialFryCost() | cop }}
          </span>
          <span
            class="relative h-7 w-12 shrink-0 rounded-full transition-colors"
            [class.bg-amber-400]="fryEnabled()"
            [class.bg-gray-200]="!fryEnabled()"
          >
            <span
              class="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform"
              [class.translate-x-5]="fryEnabled()"
              [class.translate-x-0.5]="!fryEnabled()"
            ></span>
          </span>
        </button>
      }

      <div class="space-y-1 text-sm">
        @if (combosSubtotal() > 0) {
          <div class="flex justify-between text-gray-600">
            <span>Combos</span>
            <span class="font-medium">{{ combosSubtotal() | cop }}</span>
          </div>
        }
        @if (traysSubtotal() > 0) {
          <div class="flex justify-between text-gray-600">
            <span>Bandejas sueltas</span>
            <span class="font-medium">{{ traysSubtotal() | cop }}</span>
          </div>
        }
        <div class="flex justify-between text-gray-600">
          <span>Domicilio (Malambo)</span>
          <span class="font-medium">{{ shipping() | cop }}</span>
        </div>
        @if (totalTrays() > 0) {
          <div
            class="flex justify-between text-gray-600"
            [class.invisible]="!fryEnabled()"
          >
            <span>Fritas ({{ totalTrays() }} bandejas)</span>
            <span class="font-medium tabular-nums">{{ potentialFryCost() | cop }}</span>
          </div>
        }
        <div class="flex justify-between text-base font-bold text-gray-900">
          <span>Total estimado</span>
          <span>{{ total() | cop }}</span>
        </div>
      </div>
      <button
        type="button"
        [disabled]="!hasSelection()"
        (click)="continue()"
        class="w-full rounded-xl bg-brand-500 py-3.5 text-sm font-semibold text-white shadow-md transition enabled:hover:bg-brand-600 disabled:opacity-40"
      >
        Continuar
      </button>
    </footer>
  `,
})
export class CustomOrder implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly orderState = inject(OrderStateService);
  private readonly router = inject(Router);

  readonly fryCostPerTray = environment.business.fryCostPerTray;
  readonly combos = signal<Product[]>([]);
  readonly trays = signal<Product[]>([]);
  readonly quantities = signal<Record<string, number>>({});
  readonly fryEnabled = signal(false);
  readonly shipping = this.orderState.shippingCost;

  readonly combosSubtotal = computed(() =>
    this.combos().reduce((acc, p) => acc + this.quantityOf(p.id) * p.price, 0),
  );

  readonly traysSubtotal = computed(() =>
    this.trays().reduce((acc, p) => acc + this.quantityOf(p.id) * p.price, 0),
  );

  readonly orderSubtotal = computed(() => this.combosSubtotal() + this.traysSubtotal());

  readonly totalTrays = computed(() => {
    const fromCombos = this.combos().reduce(
      (acc, p) => acc + this.quantityOf(p.id) * p.trayCount,
      0,
    );
    const fromTrays = this.trays().reduce((acc, p) => acc + this.quantityOf(p.id), 0);
    return fromCombos + fromTrays;
  });

  readonly potentialFryCost = computed(
    () => this.totalTrays() * this.fryCostPerTray,
  );

  readonly fryCost = computed(() =>
    this.fryEnabled() ? this.potentialFryCost() : 0,
  );

  readonly total = computed(() =>
    this.orderSubtotal() === 0 ? 0 : this.orderSubtotal() + this.fryCost() + this.shipping(),
  );

  readonly hasSelection = computed(() => this.orderSubtotal() > 0);

  async ngOnInit(): Promise<void> {
    try {
      const [combos, trays] = await Promise.all([
        this.productService.getAvailableCombos(),
        this.productService.getAvailableTrays(),
      ]);
      this.combos.set(combos.length ? combos : DEFAULT_COMBOS);
      this.trays.set(trays.length ? trays : DEFAULT_PRODUCTS);
    } catch {
      this.combos.set(DEFAULT_COMBOS);
      this.trays.set(DEFAULT_PRODUCTS);
    }
  }

  savingsOf(product: Product): number {
    return productSavings(product);
  }

  quantityOf(id: string): number {
    return this.quantities()[id] ?? 0;
  }

  increment(id: string): void {
    this.quantities.update((q) => ({ ...q, [id]: (q[id] ?? 0) + 1 }));
  }

  decrement(id: string): void {
    this.quantities.update((q) => ({ ...q, [id]: Math.max(0, (q[id] ?? 0) - 1) }));
  }

  toggleFryDirect(): void {
    this.fryEnabled.update((v) => !v);
  }

  continue(): void {
    const items: OrderItem[] = [];
    const all = [...this.combos(), ...this.trays()];

    for (const p of all) {
      const qty = this.quantityOf(p.id);
      if (qty > 0) {
        items.push({
          productId: p.id,
          productName: `${p.name} · ${p.description ?? ''}`.trim(),
          quantity: qty,
          unitPrice: p.price,
          subtotal: qty * p.price,
        });
      }
    }

    if (!items.length) {
      return;
    }

    if (this.fryCost() > 0) {
      items.push({
        productId: null,
        productName: `Servicio fritas (${this.totalTrays()} bandejas)`,
        quantity: this.totalTrays(),
        unitPrice: this.fryCostPerTray,
        subtotal: this.fryCost(),
      });
    }

    this.orderState.setItems(items);
    this.router.navigate(['/entrega']);
  }
}
