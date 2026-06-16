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
    <div class="mb-6 flex items-center justify-between gap-3">
      <div>
        <h1 class="adm-heading">Productos</h1>
        <p class="adm-subheading">Bandejas y combos para eventos.</p>
      </div>
      <button type="button" (click)="openCreate()" class="adm-btn-primary flex shrink-0 items-center gap-1.5">
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
          class="adm-chip"
          [class.adm-chip-active]="filter() === f.value"
        >
          {{ f.label }}
        </button>
      }
    </div>

    @if (notice()) {
      <p class="adm-alert adm-alert-warning mb-4">{{ notice() }}</p>
    }

    @if (loading()) {
      <p class="adm-text-muted text-sm">Cargando...</p>
    } @else if (filtered().length === 0) {
      <div class="adm-card p-8 text-center">
        <p class="adm-text-muted text-sm">No hay productos en este filtro.</p>
      </div>
    } @else {
      <div class="adm-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        @for (product of filtered(); track product.id) {
          <div class="adm-card adm-card-interactive flex flex-col p-4">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-1.5">
                  <p class="adm-text truncate text-sm font-bold">{{ product.name }}</p>
                  <span
                    class="adm-badge"
                    [class.adm-badge-violet]="isCombo(product)"
                    [class.adm-badge-info]="!isCombo(product)"
                  >
                    {{ isCombo(product) ? 'Combo' : 'Bandeja' }}
                  </span>
                </div>
                <p class="adm-text-muted truncate text-xs">{{ product.description }}</p>
              </div>
              <span
                class="adm-badge"
                [class.adm-badge-success]="product.available"
                [class.adm-badge-muted]="!product.available"
              >
                {{ product.available ? 'Disponible' : 'Oculto' }}
              </span>
            </div>

            <div class="adm-divider mt-3 flex items-center justify-between border-t pt-3">
              <div>
                <span class="adm-text-primary text-lg font-bold">{{ product.price | cop }}</span>
                @if (product.referencePrice && product.referencePrice > product.price) {
                  <span class="adm-text-muted ml-1.5 text-xs line-through">
                    {{ product.referencePrice | cop }}
                  </span>
                }
              </div>
              <span class="adm-text-muted text-xs">
                {{ product.trayCount }} {{ product.trayCount === 1 ? 'bandeja' : 'bandejas' }}
              </span>
            </div>

            <div class="mt-4 flex items-center gap-2">
              <button type="button" (click)="openEdit(product)" class="adm-btn-ghost flex-1">Editar</button>
              <button
                type="button"
                (click)="toggleAvailability(product)"
                class="flex-1"
                [class.adm-btn-soft-warning]="product.available"
                [class.adm-btn-soft-success]="!product.available"
              >
                {{ product.available ? 'Ocultar' : 'Mostrar' }}
              </button>
              <button type="button" (click)="remove(product)" class="adm-btn-danger" aria-label="Eliminar">
                <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </button>
            </div>
          </div>
        }
      </div>
    }

    @if (showForm()) {
      <div class="adm-modal-overlay" role="dialog" aria-modal="true">
        <div class="adm-modal-backdrop" (click)="closeForm()" aria-hidden="true"></div>
        <div class="adm-modal adm-card adm-modal-panel shadow-2xl">
          <div class="overflow-y-auto p-6">
        <h2 class="adm-text mb-4 text-base font-semibold">
          {{ editingId() ? 'Editar producto' : 'Nuevo producto' }}
        </h2>
        <form [formGroup]="form" (ngSubmit)="save()" class="space-y-3">
          <label class="block">
            <span class="adm-label">Tipo</span>
            <app-custom-select
              formControlName="kind"
              placeholder="Selecciona el tipo"
              [options]="kindOptions"
            />
          </label>

          <label class="block">
            <span class="adm-label">Nombre</span>
            <input type="text" formControlName="name" placeholder="Bandeja 25" class="adm-input" />
          </label>

          <label class="block">
            <span class="adm-label">Descripción</span>
            <input type="text" formControlName="description" placeholder="Empanadas de pollo" class="adm-input" />
          </label>

          @if (form.controls.kind.value === 'combo') {
            <div class="grid grid-cols-2 gap-3">
              <label class="block">
                <span class="adm-label">Precio</span>
                <input type="number" formControlName="price" placeholder="25000" class="adm-input" />
              </label>
              <label class="block">
                <span class="adm-label">Bandejas que incluye</span>
                <input type="number" formControlName="trayCount" min="1" class="adm-input" />
              </label>
            </div>
          } @else {
            <label class="block">
              <span class="adm-label">Precio</span>
              <input type="number" formControlName="price" placeholder="25000" class="adm-input" />
            </label>
          }

          @if (form.controls.kind.value === 'combo') {
            <label class="block">
              <span class="adm-label">
                Precio de referencia
                <span class="adm-text-muted opacity-60">(para mostrar ahorro)</span>
              </span>
              <input type="number" formControlName="referencePrice" placeholder="63000" class="adm-input" />
            </label>
          }

          <label class="block">
            <span class="adm-label">
              Stock <span class="adm-text-muted opacity-60">(opcional)</span>
            </span>
            <input type="number" formControlName="stock" placeholder="Sin límite" class="adm-input" />
          </label>

          <label class="adm-checkbox-row">
            <span class="adm-text-secondary text-sm font-medium">Disponible para clientes</span>
            <input type="checkbox" formControlName="available" />
          </label>

          @if (error()) {
            <p class="adm-alert adm-alert-error text-xs">{{ error() }}</p>
          }

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" (click)="closeForm()" class="adm-btn-ghost">Cancelar</button>
            <button type="submit" [disabled]="form.invalid || saving()" class="adm-btn-primary disabled:opacity-40">
              {{ saving() ? 'Guardando...' : editingId() ? 'Guardar' : 'Agregar' }}
            </button>
          </div>
        </form>
          </div>
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
