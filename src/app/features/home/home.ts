import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { Product } from '../../core/models/product.model';
import { OrderStateService } from '../../core/services/order-state.service';
import { ProductService } from '../../core/services/product.service';
import { environment } from '../../../environments/environment';
import { CopPipe } from '../../shared/pipes/cop.pipe';
import { DEFAULT_PRODUCTS } from '../../shared/data/default-products';
import { WhatsappButton } from '../../shared/components/whatsapp-button/whatsapp-button';
import { whatsappHomeMessage } from '../../shared/utils/whatsapp-messages';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CopPipe, RouterLink, WhatsappButton],
  template: `
    <header class="flex items-center justify-between px-4 pt-5">
      <span class="font-brand text-2xl text-accent-600">DeliPasabocas</span>
    </header>

    <main class="px-4 pb-32">
      <!-- Hero -->
      <section
        class="mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 px-5 py-6 text-white shadow-lg"
      >
        <p class="text-xs font-medium uppercase tracking-widest text-brand-100">
          Malambo, Atlántico
        </p>
        <h1 class="mt-1 text-2xl font-extrabold leading-tight">
          Pasabocas deliciosos para cada ocasión
        </h1>
        <p class="mt-1.5 text-sm text-brand-100">
          Haz tu pedido en menos de un minuto. Empanadas, deditos y bandejas
          para tu evento.
        </p>
      </section>

      <!-- Acceso a seguimiento -->
      <a
        routerLink="/seguimiento"
        class="mt-4 flex items-center justify-between rounded-2xl border border-cream-200 bg-white px-4 py-3 text-sm shadow-sm"
      >
        <span class="flex items-center gap-2 font-medium text-gray-700">
          <svg viewBox="0 0 24 24" class="h-5 w-5 text-brand-500" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="7" />
            <path stroke-linecap="round" d="M21 21l-4-4" />
          </svg>
          ¿Ya hiciste un pedido? Ver seguimiento
        </span>
        <span class="text-gray-300">›</span>
      </a>

      <h2 class="mb-3 mt-6 text-base font-semibold text-gray-800">
        1. Elige tu producto
      </h2>
      <p class="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
        Bandejas más vendidas · máx. {{ maxPerProduct }} por producto
      </p>

      @if (loading()) {
        <div class="grid grid-cols-2 gap-3">
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="h-52 animate-pulse rounded-2xl bg-cream-200"></div>
          }
        </div>
      } @else {
        <div class="grid grid-cols-2 items-stretch gap-3">
          @for (product of products(); track product.id) {
            <div
              class="relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition"
              [class.border-brand-500]="quantityOf(product.id) > 0"
              [class.ring-2]="quantityOf(product.id) > 0"
              [class.ring-brand-200]="quantityOf(product.id) > 0"
              [class.border-transparent]="quantityOf(product.id) === 0"
            >
              <div
                class="flex h-24 shrink-0 items-center justify-center bg-gradient-to-br from-accent-400/30 to-accent-600/10 text-4xl"
              >
                🥟
              </div>
              <div class="flex flex-1 flex-col p-3">
                <div class="flex-1">
                  <p class="text-sm font-semibold text-gray-800">
                    {{ product.name }}
                  </p>
                  <p class="line-clamp-2 text-xs text-gray-500">{{ product.description }}</p>
                  <p class="mt-1 text-sm font-bold text-brand-500">
                    {{ product.price | cop }}
                  </p>
                </div>

                <div class="mt-auto min-h-10 pt-3">
                  @if (quantityOf(product.id) === 0) {
                    <button
                      type="button"
                      (click)="increment(product.id)"
                      class="flex h-10 w-full items-center justify-center gap-1 rounded-xl border border-brand-200 bg-brand-50 text-sm font-semibold text-brand-600 transition active:scale-95"
                    >
                      <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Agregar
                    </button>
                  } @else {
                    <div
                      class="flex h-10 items-center justify-between rounded-xl bg-brand-500 px-1.5 text-white"
                    >
                      <button
                        type="button"
                        (click)="decrement(product.id)"
                        aria-label="Quitar uno"
                        class="grid h-7 w-7 place-items-center rounded-lg bg-white/15 transition active:scale-90"
                      >
                        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                          <path d="M5 12h14" />
                        </svg>
                      </button>
                      <span class="text-sm font-bold">{{ quantityOf(product.id) }}</span>
                      <button
                        type="button"
                        (click)="increment(product.id)"
                        [disabled]="quantityOf(product.id) >= maxPerProduct"
                        aria-label="Agregar uno"
                        class="grid h-7 w-7 place-items-center rounded-lg bg-white/15 transition active:scale-90 disabled:opacity-40"
                      >
                        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </button>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }

      <h3 class="mb-2 mt-6 text-sm font-medium text-gray-700">
        ¿Es para un evento?
      </h3>
      <button
        type="button"
        (click)="goCustom()"
        class="flex w-full items-center justify-between rounded-2xl border border-brand-100 bg-brand-50 p-4 text-left transition active:scale-[0.99]"
      >
        <div>
          <p class="text-sm font-semibold text-brand-600">
            Pedido personalizado
          </p>
          <p class="text-xs text-gray-500">
            Combos con pedido mínimo y mejor precio para tu evento
          </p>
        </div>
        <span class="text-xl text-brand-400">›</span>
      </button>
    </main>

    <footer
      class="fixed inset-x-0 bottom-0 space-y-3 border-t border-cream-200 bg-cream-50/95 p-4 backdrop-blur"
    >
      <app-whatsapp-button
        class="absolute bottom-full right-4 mb-3"
        variant="icon"
        [message]="whatsappMessage()"
      />
      @if (itemCount() > 0) {
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-500">
            {{ itemCount() }} {{ itemCount() === 1 ? 'producto' : 'productos' }}
          </span>
          <span class="font-bold text-gray-900">{{ subtotal() | cop }}</span>
        </div>
      }
      <button
        type="button"
        [disabled]="itemCount() === 0"
        (click)="continue()"
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 text-sm font-semibold text-white shadow-md transition enabled:hover:bg-brand-600 disabled:opacity-40"
      >
        Continuar
        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </footer>
  `,
})
export class Home implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly orderState = inject(OrderStateService);
  private readonly router = inject(Router);

  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly quantities = signal<Record<string, number>>({});
  readonly maxPerProduct = environment.business.maxTraysPerProduct;

  readonly itemCount = computed(() =>
    Object.values(this.quantities()).reduce((acc, n) => acc + n, 0),
  );

  readonly subtotal = computed(() =>
    this.products().reduce(
      (acc, p) => acc + this.quantityOf(p.id) * p.price,
      0,
    ),
  );

  readonly whatsappMessage = computed(() =>
    whatsappHomeMessage(this.itemCount(), this.subtotal()),
  );

  async ngOnInit(): Promise<void> {
    try {
      const data = await this.productService.getAvailableTrays();
      this.products.set(data.length ? data : DEFAULT_PRODUCTS);
    } catch {
      this.products.set(DEFAULT_PRODUCTS);
    } finally {
      this.loading.set(false);
    }
  }

  quantityOf(id: string): number {
    return this.quantities()[id] ?? 0;
  }

  increment(id: string): void {
    this.quantities.update((q) => ({
      ...q,
      [id]: Math.min(this.maxPerProduct, (q[id] ?? 0) + 1),
    }));
  }

  decrement(id: string): void {
    this.quantities.update((q) => ({
      ...q,
      [id]: Math.max(0, (q[id] ?? 0) - 1),
    }));
  }

  continue(): void {
    const items = this.products()
      .filter((p) => this.quantityOf(p.id) > 0)
      .map((p) => {
        const quantity = this.quantityOf(p.id);
        return {
          productId: p.id,
          productName: `${p.name} · ${p.description ?? ''}`.trim(),
          quantity,
          unitPrice: p.price,
          subtotal: quantity * p.price,
        };
      });

    if (!items.length) {
      return;
    }
    this.orderState.setItems(items);
    this.router.navigate(['/entrega']);
  }

  goCustom(): void {
    this.router.navigate(['/pedido']);
  }
}
