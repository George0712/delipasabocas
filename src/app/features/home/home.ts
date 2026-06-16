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

    <div class="app-shell app-page pb-32">

      <header class="flex items-center justify-between px-4 pt-5">

        <span class="font-brand text-2xl text-[var(--app-primary)]">DeliPasabocas</span>

      </header>



      <main class="px-4">

        <section class="app-card-kpi mt-4 overflow-hidden px-5 py-6">

          <p class="text-xs font-medium uppercase tracking-widest text-white/70">

            Malambo, Atlántico

          </p>

          <h1 class="mt-1 text-2xl font-extrabold leading-tight">

            Pasabocas deliciosos para cada ocasión

          </h1>

          <p class="mt-1.5 text-sm text-white/80">

            Haz tu pedido en menos de un minuto. Empanadas, deditos y bandejas

            para tu evento.

          </p>

        </section>



        <a

          routerLink="/seguimiento"

          class="app-card app-card-interactive mt-4 flex items-center justify-between px-4 py-3 text-sm"

        >

          <span class="app-text-secondary flex items-center gap-2 font-medium">

            <svg viewBox="0 0 24 24" class="h-5 w-5 text-[var(--app-primary)]" fill="none" stroke="currentColor" stroke-width="2">

              <circle cx="11" cy="11" r="7" />

              <path stroke-linecap="round" d="M21 21l-4-4" />

            </svg>

            ¿Ya hiciste un pedido? Ver seguimiento

          </span>

          <span class="app-text-muted">›</span>

        </a>



        <h2 class="app-heading mb-3 mt-6">1. Elige tu producto</h2>

        <p class="app-eyebrow mb-3">

          Bandejas más vendidas · máx. {{ maxPerProduct }} por producto

        </p>



        @if (loading()) {

          <div class="grid grid-cols-1 gap-3">

            @for (i of [1, 2, 3, 4]; track i) {

              <div class="app-skeleton h-52"></div>

            }

          </div>

        } @else {

          <div class="app-stagger grid grid-cols-1 items-stretch gap-3">

            @for (product of products(); track product.id) {

              <div

                class="app-card app-card-interactive relative flex h-full flex-col overflow-hidden text-left"

                [class.app-card-selected]="quantityOf(product.id) > 0"

              >

                <div class="app-media h-32 shrink-0 text-4xl">🥟</div>

                <div class="flex flex-1 flex-col p-3">

                  <div class="flex-1">

                    <p class="app-text text-sm font-semibold">{{ product.name }}</p>

                    <p class="app-text-muted line-clamp-2 text-xs">{{ product.description }}</p>

                    <p class="app-text-primary mt-1 text-sm font-bold">{{ product.price | cop }}</p>

                  </div>



                  <div class="mt-auto min-h-10 pt-3">

                    @if (quantityOf(product.id) === 0) {

                      <button type="button" (click)="increment(product.id)" class="app-btn-soft flex h-10 w-full items-center justify-center gap-1">

                        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">

                          <path d="M12 5v14M5 12h14" />

                        </svg>

                        Agregar

                      </button>

                    } @else {

                      <div class="flex h-10 items-center justify-between rounded-xl bg-[var(--app-primary)] px-1.5 text-white">

                        <button type="button" (click)="decrement(product.id)" aria-label="Quitar uno" class="grid h-7 w-7 place-items-center rounded-lg bg-white/15 transition active:scale-90">

                          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">

                            <path d="M5 12h14" />

                          </svg>

                        </button>

                        <span class="text-sm font-bold">{{ quantityOf(product.id) }}</span>

                        <button type="button" (click)="increment(product.id)" [disabled]="quantityOf(product.id) >= maxPerProduct" aria-label="Agregar uno" class="grid h-7 w-7 place-items-center rounded-lg bg-white/15 transition active:scale-90 disabled:opacity-40">

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



        <h3 class="app-text-secondary mb-2 mt-6 text-sm font-medium">¿Es para un evento?</h3>

        <button type="button" (click)="goCustom()" class="app-card app-card-interactive flex w-full items-center justify-between p-4 text-left">

          <div>

            <p class="app-text-primary text-sm font-semibold">Pedido personalizado</p>

            <p class="app-text-muted text-xs">Combos con pedido mínimo y mejor precio para tu evento</p>

          </div>

          <span class="text-xl text-[var(--app-primary-soft)]">›</span>

        </button>

      </main>



      <footer class="app-footer-bar">

        <app-whatsapp-button class="absolute bottom-full right-4 mb-3" variant="icon" [message]="whatsappMessage()" />

        @if (itemCount() > 0) {

          <div class="flex items-center justify-between text-sm">

            <span class="app-text-muted">{{ itemCount() }} {{ itemCount() === 1 ? 'producto' : 'productos' }}</span>

            <span class="app-text font-bold">{{ subtotal() | cop }}</span>

          </div>

        }

        <button type="button" [disabled]="itemCount() === 0" (click)="continue()" class="app-btn-primary w-full">

          Continuar

          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">

            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />

          </svg>

        </button>

      </footer>

    </div>

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


