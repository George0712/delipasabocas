import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { isCombo, Product, ProductKind } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';
import { CustomSelect } from '../../../shared/components/custom-select/custom-select';
import { CopPipe } from '../../../shared/pipes/cop.pipe';

type Filter = 'all' | ProductKind;

@Component({
  selector: 'app-products-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CopPipe, CustomSelect],
  template: `
    <div class="mb-5 flex items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Productos</h1>
        <p class="mt-0.5 text-sm text-gray-500">Bandejas y combos para eventos.</p>
      </div>
      <button
        type="button"
        (click)="openCreate()"
        class="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-brand-600"
      >
        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" />
        </svg>
        Nuevo
      </button>
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
      @for (f of filters; track f.value) {
        <button
          type="button"
          (click)="filter.set(f.value)"
          class="rounded-full px-3 py-1.5 text-xs font-semibold transition"
          [class.bg-brand-500]="filter() === f.value"
          [class.text-white]="filter() === f.value"
          [class.bg-white]="filter() !== f.value"
          [class.text-gray-600]="filter() !== f.value"
          [class.border]="filter() !== f.value"
          [class.border-cream-200]="filter() !== f.value"
        >
          {{ f.label }}
        </button>
      }
    </div>

    @if (notice()) {
      <p class="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">{{ notice() }}</p>
    }

    @if (loading()) {
      <p class="text-sm text-gray-400">Cargando...</p>
    } @else if (filtered().length === 0) {
      <div class="rounded-2xl border border-cream-200 bg-white p-8 text-center">
        <p class="text-sm text-gray-400">No hay productos en este filtro.</p>
      </div>
    } @else {
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        @for (product of filtered(); track product.id) {
          <div class="flex flex-col rounded-2xl border border-cream-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-1.5">
                  <p class="truncate text-sm font-bold text-gray-900">{{ product.name }}</p>
                  <span
                    class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    [class.bg-violet-50]="isCombo(product)"
                    [class.text-violet-700]="isCombo(product)"
                    [class.bg-sky-50]="!isCombo(product)"
                    [class.text-sky-700]="!isCombo(product)"
                  >
                    {{ isCombo(product) ? 'Combo' : 'Bandeja' }}
                  </span>
                </div>
                <p class="truncate text-xs text-gray-500">{{ product.description }}</p>
              </div>
              <span
                class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                [class.bg-emerald-50]="product.available"
                [class.text-emerald-700]="product.available"
                [class.bg-gray-100]="!product.available"
                [class.text-gray-500]="!product.available"
              >
                {{ product.available ? 'Disponible' : 'Oculto' }}
              </span>
            </div>

            <div class="mt-3 flex items-center justify-between border-t border-cream-100 pt-3">
              <div>
                <span class="text-lg font-bold text-brand-500">{{ product.price | cop }}</span>
                @if (product.referencePrice && product.referencePrice > product.price) {
                  <span class="ml-1.5 text-xs text-gray-400 line-through">
                    {{ product.referencePrice | cop }}
                  </span>
                }
              </div>
              <span class="text-xs text-gray-400">
                {{ product.trayCount }} {{ product.trayCount === 1 ? 'bandeja' : 'bandejas' }}
              </span>
            </div>

            <div class="mt-4 flex items-center gap-2">
              <button type="button" (click)="openEdit(product)" class="flex-1 rounded-xl border border-cream-200 bg-cream-50 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-cream-100">Editar</button>
              <button type="button" (click)="toggleAvailability(product)" class="flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition" [class.bg-amber-50]="product.available" [class.text-amber-700]="product.available" [class.bg-emerald-50]="!product.available" [class.text-emerald-700]="!product.available">
                {{ product.available ? 'Ocultar' : 'Mostrar' }}
              </button>
              <button type="button" (click)="remove(product)" class="rounded-xl border border-red-100 bg-red-50 p-2 text-red-500 transition hover:bg-red-100" aria-label="Eliminar">
                <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </button>
            </div>
          </div>
        }
      </div>
    }

    @if (showForm()) {
      <div class="fixed inset-0 z-40 bg-black/40" (click)="closeForm()" aria-hidden="true"></div>
      <div class="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div class="overflow-y-auto p-6">
        <h2 class="mb-4 text-base font-semibold text-gray-800">
          {{ editingId() ? 'Editar producto' : 'Nuevo producto' }}
        </h2>
        <form [formGroup]="form" (ngSubmit)="save()" class="space-y-3">
          <label class="block">
            <span class="mb-1 block text-xs font-medium text-gray-500">Tipo</span>
            <app-custom-select
              formControlName="kind"
              placeholder="Selecciona el tipo"
              [options]="kindOptions"
            />
          </label>

          <label class="block">
            <span class="mb-1 block text-xs font-medium text-gray-500">Nombre</span>
            <input type="text" formControlName="name" placeholder="Bandeja 25" class="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
          </label>

          <label class="block">
            <span class="mb-1 block text-xs font-medium text-gray-500">Descripción</span>
            <input type="text" formControlName="description" placeholder="Empanadas de pollo" class="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
          </label>

          @if (form.controls.kind.value === 'combo') {
            <div class="grid grid-cols-2 gap-3">
              <label class="block">
                <span class="mb-1 block text-xs font-medium text-gray-500">Precio</span>
                <input type="number" formControlName="price" placeholder="25000" class="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
              </label>
              <label class="block">
                <span class="mb-1 block text-xs font-medium text-gray-500">Bandejas que incluye</span>
                <input type="number" formControlName="trayCount" min="1" class="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
              </label>
            </div>
          } @else {
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-gray-500">Precio</span>
              <input type="number" formControlName="price" placeholder="25000" class="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
            </label>
          }

          @if (form.controls.kind.value === 'combo') {
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-gray-500">
                Precio de referencia
                <span class="text-gray-300">(para mostrar ahorro)</span>
              </span>
              <input type="number" formControlName="referencePrice" placeholder="63000" class="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
            </label>
          }

          <label class="block">
            <span class="mb-1 block text-xs font-medium text-gray-500">
              Stock <span class="text-gray-300">(opcional)</span>
            </span>
            <input type="number" formControlName="stock" placeholder="Sin límite" class="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
          </label>

          <label class="flex items-center justify-between rounded-xl border border-cream-200 px-3 py-2.5">
            <span class="text-sm font-medium text-gray-600">Disponible para clientes</span>
            <input type="checkbox" formControlName="available" class="h-5 w-5 accent-brand-500" />
          </label>

          @if (error()) {
            <p class="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{{ error() }}</p>
          }

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" (click)="closeForm()" class="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-cream-100">Cancelar</button>
            <button type="submit" [disabled]="form.invalid || saving()" class="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition enabled:hover:bg-brand-600 disabled:opacity-40">
              {{ saving() ? 'Guardando...' : editingId() ? 'Guardar' : 'Agregar' }}
            </button>
          </div>
        </form>
        </div>
      </div>
    }
  `,
})
export class ProductsAdmin implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly fb = inject(FormBuilder);

  readonly isCombo = isCombo;
  readonly filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'tray', label: 'Bandejas' },
    { value: 'combo', label: 'Combos' },
  ];

  readonly kindOptions = [
    { value: 'tray', label: 'Bandeja' },
    { value: 'combo', label: 'Combo (evento)' },
  ];

  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly filter = signal<Filter>('all');

  readonly filtered = computed(() => {
    const f = this.filter();
    const all = this.products();
    return f === 'all' ? all : all.filter((p) => p.kind === f);
  });

  readonly form = this.fb.group({
    kind: this.fb.nonNullable.control<ProductKind>('tray'),
    name: this.fb.nonNullable.control('', Validators.required),
    description: this.fb.nonNullable.control(''),
    price: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0)]),
    referencePrice: this.fb.control<number | null>(null),
    trayCount: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    stock: this.fb.control<number | null>(null),
    available: this.fb.nonNullable.control(true),
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.products.set(await this.productService.getAll());
    } catch {
      this.products.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  openCreate(): void {
    this.error.set(null);
    this.editingId.set(null);
    this.form.reset({
      kind: 'tray',
      name: '',
      description: '',
      price: 0,
      referencePrice: null,
      trayCount: 1,
      stock: null,
      available: true,
    });
    this.showForm.set(true);
  }

  openEdit(product: Product): void {
    this.error.set(null);
    this.editingId.set(product.id);
    this.form.reset({
      kind: product.kind,
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      referencePrice: product.referencePrice,
      trayCount: product.trayCount,
      stock: product.stock,
      available: product.available,
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    const stock =
      v.stock === null || (v.stock as unknown as string) === '' ? null : Number(v.stock);
    const referencePrice =
      v.kind === 'combo' && v.referencePrice !== null && v.referencePrice !== ('' as unknown as number)
        ? Number(v.referencePrice)
        : null;

    const payload: Omit<Product, 'id'> = {
      name: v.name,
      description: v.description,
      price: v.price,
      stock,
      imageUrl: null,
      available: v.available,
      deleted: false,
      kind: v.kind,
      referencePrice,
      trayCount: v.kind === 'tray' ? 1 : v.trayCount,
    };

    try {
      const id = this.editingId();
      if (id) {
        const updated = await this.productService.update(id, payload);
        this.products.update((list) => list.map((p) => (p.id === id ? updated : p)));
      } else {
        const created = await this.productService.create(payload);
        this.products.update((list) => [...list, created]);
      }
      this.closeForm();
    } catch (err) {
      this.error.set('No se pudo guardar. Verifica la conexión con Supabase.');
      console.error(err);
    } finally {
      this.saving.set(false);
    }
  }

  async toggleAvailability(product: Product): Promise<void> {
    try {
      const updated = await this.productService.update(product.id, {
        available: !product.available,
      });
      this.products.update((list) =>
        list.map((p) => (p.id === product.id ? updated : p)),
      );
    } catch (err) {
      console.error('No se pudo cambiar la disponibilidad', err);
    }
  }

  async remove(product: Product): Promise<void> {
    this.notice.set(null);
    const ok = confirm(`¿Eliminar "${product.name}"?`);
    if (!ok) {
      return;
    }
    try {
      const deleted = await this.productService.softDelete(product.id);
      if (deleted) {
        this.products.update((list) => list.filter((p) => p.id !== product.id));
      } else {
        this.notice.set(
          `"${product.name}" tiene pedidos activos y no se puede eliminar. Puedes ocultarlo para que no aparezca a los clientes.`,
        );
      }
    } catch (err) {
      this.notice.set('No se pudo eliminar el producto.');
      console.error(err);
    }
  }
}
