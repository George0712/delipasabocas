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
    <div class="app-shell app-page">
    <app-flow-header title="Pedido personalizado" />

    <main class="px-4 pb-56 pt-2">

      @if (combos().length > 0) {
        <h2 class="app-eyebrow mb-2">Combos para eventos</h2>
        <div class="space-y-3">
          @for (combo of combos(); track combo.id) {
            <div class="app-card flex h-full flex-col p-4 transition" [class.app-card-selected]="quantityOf(combo.id) > 0">
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="app-text text-sm font-bold">{{ combo.name }}</p>
                  @if (savingsOf(combo) > 0) {
                    <span class="rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[10px] font-semibold text-[#047857]">Ahorras {{ savingsOf(combo) | cop }}</span>
                  }
                </div>
                <p class="app-text-muted mt-0.5 text-xs">{{ combo.description }}</p>
                <div class="mt-2 flex items-baseline gap-2">
                  <span class="app-text-primary text-base font-bold">{{ combo.price | cop }}</span>
                  @if (combo.referencePrice && combo.referencePrice > combo.price) {
                    <span class="app-text-muted text-xs line-through">{{ combo.referencePrice | cop }}</span>
                  }
                </div>
              </div>

              <div class="mt-auto min-h-10 pt-3">
                @if (quantityOf(combo.id) === 0) {
                  <button type="button" (click)="increment(combo.id)" class="app-btn-soft flex h-10 w-full items-center justify-center">Agregar combo</button>
                } @else {
                  <div class="flex h-10 items-center justify-between rounded-xl bg-[var(--app-primary)] px-1.5 text-white">
                    <button type="button" (click)="decrement(combo.id)" aria-label="Quitar uno" class="grid h-7 w-7 place-items-center rounded-lg bg-white/15">
                      <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14" /></svg>
                    </button>
                    <span class="min-w-[1.25rem] text-center text-sm font-bold tabular-nums">{{ quantityOf(combo.id) }}</span>
                    <button type="button" (click)="increment(combo.id)" aria-label="Agregar uno" class="grid h-7 w-7 place-items-center rounded-lg bg-white/15">
                      <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    </button>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      @if (trays().length > 0) {
        <h2 class="app-eyebrow mb-2 mt-6">O arma tu pedido</h2>
        <div class="space-y-3">
          @for (product of trays(); track product.id) {
            <div class="app-card flex items-center justify-between p-4">
              <div class="pr-3">
                <p class="app-text text-sm font-semibold">{{ product.name }}</p>
                <p class="app-text-muted text-xs">{{ product.description }}</p>
                <p class="app-text-primary mt-1 text-sm font-bold">{{ product.price | cop }}</p>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <button type="button" (click)="decrement(product.id)" aria-label="Quitar uno" class="grid h-8 w-8 place-items-center rounded-full border" [style.border-color]="'var(--app-border)'" [style.color]="'var(--app-text-secondary)'">
                  <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14" /></svg>
                </button>
                <span class="w-6 text-center text-sm font-semibold tabular-nums">{{ quantityOf(product.id) }}</span>
                <button type="button" (click)="increment(product.id)" aria-label="Agregar uno" class="grid h-8 w-8 place-items-center rounded-full bg-[var(--app-primary)] text-white">
                  <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </main>

    <footer class="app-footer-bar z-20">
      @if (totalTrays() > 0) {
        <button type="button" (click)="toggleFryDirect()" class="app-card flex w-full items-center gap-3 px-4 py-3 text-left transition active:scale-[0.99]" [class.app-card-selected]="fryEnabled()">
          <span class="app-surface-inset grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg">🔥</span>
          <div class="min-w-0 flex-1">
            <p class="app-text text-sm font-bold">¿Entregar picadas fritas?</p>
            <p class="app-text-muted text-xs">{{ fryCostPerTray | cop }}/bandeja · {{ totalTrays() }} {{ totalTrays() === 1 ? 'bandeja' : 'bandejas' }}</p>
          </div>
          <span class="app-text-primary w-[4.5rem] shrink-0 text-right text-xs font-semibold tabular-nums" [class.invisible]="!fryEnabled()">+{{ potentialFryCost() | cop }}</span>
          <span class="relative h-7 w-12 shrink-0 rounded-full transition-colors" [style.background]="fryEnabled() ? 'var(--app-primary)' : 'var(--app-border)'">
            <span class="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform" [class.translate-x-5]="fryEnabled()" [class.translate-x-0.5]="!fryEnabled()"></span>
          </span>
        </button>
      }

      <div class="space-y-1 text-sm">
        @if (combosSubtotal() > 0) {
          <div class="app-text-secondary flex justify-between"><span>Combos</span><span class="font-medium">{{ combosSubtotal() | cop }}</span></div>
        }
        @if (traysSubtotal() > 0) {
          <div class="app-text-secondary flex justify-between"><span>Bandejas sueltas</span><span class="font-medium">{{ traysSubtotal() | cop }}</span></div>
        }
        <div class="app-text-secondary flex justify-between">
          <span>Domicilio <span class="app-text-muted block text-[10px] font-normal">Se calcula con tu dirección</span></span>
          <span class="font-medium">{{ shipping() | cop }}</span>
        </div>
        @if (totalTrays() > 0) {
          <div class="app-text-secondary flex justify-between" [class.invisible]="!fryEnabled()">
            <span>Picadas fritas ({{ totalTrays() }} bandejas)</span>
            <span class="font-medium tabular-nums">{{ potentialFryCost() | cop }}</span>
          </div>
        }
        <div class="app-text flex justify-between text-base font-bold">
          <span>Total estimado</span>
          <span>{{ total() | cop }}</span>
        </div>
      </div>
      <button type="button" [disabled]="!hasSelection()" (click)="continue()" class="app-btn-primary w-full">Continuar</button>
    </footer>
    </div>
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
      const trays = this.totalTrays();
      items.push({
        productId: null,
        productName: `Picadas fritas (${trays} ${trays === 1 ? 'bandeja' : 'bandejas'})`,
        quantity: trays,
        unitPrice: this.fryCostPerTray,
        subtotal: this.fryCost(),
      });
    }

    this.orderState.setItems(items);
    this.router.navigate(['/entrega']);
  }
}
