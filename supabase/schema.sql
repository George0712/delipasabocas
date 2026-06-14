-- =====================================================================
-- DeliPasabocas · Esquema de base de datos (Supabase / PostgreSQL)
-- Este archivo refleja el estado YA DESPLEGADO en el proyecto Supabase
-- "delipasabocas" (ref: ugeywpbymtwojvrcjcdz). Sirve como referencia y
-- para recrear el entorno desde cero si fuese necesario.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum (
      'pending_payment',
      'payment_validated',
      'preparing',
      'on_the_way',
      'delivered',
      'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type payment_method as enum ('nequi', 'bancolombia');
  end if;

  if not exists (select 1 from pg_type where typname = 'product_kind') then
    create type product_kind as enum ('tray', 'combo');
  end if;
end$$;

-- ---------------------------------------------------------------------
-- profiles (usuarios administrativos, enlazados a auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text default 'admin',
  created_at timestamptz default now()
);

-- Verifica si el usuario autenticado es administrador.
-- SECURITY DEFINER para poder leer profiles sin chocar con su propio RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric not null,
  stock integer,
  image_url text,
  available boolean default true,
  deleted boolean not null default false,
  kind product_kind not null default 'tray',
  reference_price numeric,
  tray_count integer not null default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_phone text not null,
  address text not null,
  notes text,
  delivery_date date not null,
  delivery_time text,
  subtotal numeric not null,
  shipping_cost numeric default 0,
  total numeric not null,
  status order_status default 'pending_payment',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  quantity integer not null,
  unit_price numeric not null,
  subtotal numeric not null
);

-- ---------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  method payment_method not null,
  receipt_url text,
  validated boolean default false,
  validated_at timestamptz,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- business_settings (singleton: datos de pago editables desde el admin)
-- ---------------------------------------------------------------------
create table if not exists public.business_settings (
  id smallint primary key default 1 check (id = 1),
  nequi text not null,
  bancolombia_account text not null,
  bancolombia_holder text not null,
  whatsapp_number text not null default '573009999999',
  updated_at timestamptz default now()
);

insert into public.business_settings (id, nequi, bancolombia_account, bancolombia_holder, whatsapp_number)
values (1, '3009999999', '123 456 78910', 'Deli Pasabocas', '573009999999')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- status_history
-- ---------------------------------------------------------------------
create table if not exists public.status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status order_status not null,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- Row Level Security
--   · El público (anon) puede leer productos y crear pedidos/items/pagos.
--   · La gestión administrativa requiere un usuario autenticado que sea
--     admin (is_admin()).
--   · status_history es de solo gestión admin (insert/select con is_admin()).
--   · profiles queda sin políticas públicas: se opera mediante el rol de
--     servicio o la función SECURITY DEFINER is_admin().
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.status_history enable row level security;
alter table public.business_settings enable row level security;

-- La lectura pública excluye productos eliminados lógicamente (deleted = true).
create policy "public_read_products" on public.products
  for select to anon using (deleted = false);
create policy "admin_full_products" on public.products
  for all to authenticated using (is_admin()) with check (is_admin());

create policy "public_insert_orders" on public.orders
  for insert to anon with check (true);
create policy "admin_full_orders" on public.orders
  for all to authenticated using (is_admin()) with check (is_admin());

create policy "public_insert_order_items" on public.order_items
  for insert to anon with check (true);
create policy "admin_read_order_items" on public.order_items
  for select to authenticated using (is_admin());

create policy "public_insert_payments" on public.payments
  for insert to anon with check (true);
create policy "admin_full_payments" on public.payments
  for all to authenticated using (is_admin()) with check (is_admin());

create policy "admin_insert_status_history" on public.status_history
  for insert to authenticated with check (is_admin());
create policy "admin_read_status_history" on public.status_history
  for select to authenticated using (is_admin());

create policy "public_read_business_settings" on public.business_settings
  for select to anon, authenticated using (true);
create policy "admin_update_business_settings" on public.business_settings
  for update to authenticated using (is_admin()) with check (is_admin());
create policy "admin_insert_business_settings" on public.business_settings
  for insert to authenticated with check (is_admin());

-- ---------------------------------------------------------------------
-- get_order_status: seguimiento público de un pedido por su número.
-- SECURITY DEFINER para exponer solo campos seguros + historial sin
-- abrir SELECT sobre toda la tabla orders al rol anónimo.
-- ---------------------------------------------------------------------
create or replace function public.get_order_status(p_order_number text)
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'order_number', o.order_number,
    'status', o.status,
    'customer_name', o.customer_name,
    'delivery_date', o.delivery_date,
    'delivery_time', o.delivery_time,
    'total', o.total,
    'created_at', o.created_at,
    'history', coalesce((
      select json_agg(
        json_build_object('status', sh.status, 'created_at', sh.created_at)
        order by sh.created_at
      )
      from status_history sh where sh.order_id = o.id
    ), '[]'::json)
  )
  from orders o
  where upper(o.order_number) = upper(p_order_number)
  limit 1;
$$;

revoke all on function public.get_order_status(text) from public;
grant execute on function public.get_order_status(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- create_order: crea el pedido + items + pago de forma ATÓMICA y genera
-- el número de pedido en el servidor. Garantiza que el número devuelto al
-- cliente es exactamente el que queda almacenado. Si un product_id no es
-- válido o no existe, el item se guarda con product_id nulo (no rompe).
-- ---------------------------------------------------------------------
create or replace function public.create_order(
  p_order jsonb,
  p_items jsonb,
  p_payment_method text default null
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_order_number text;
  v_item jsonb;
  v_product_id uuid;
begin
  loop
    v_order_number := 'DPB-' || lpad(((floor(random() * 900000) + 100000)::int)::text, 6, '0');
    exit when not exists (select 1 from orders where order_number = v_order_number);
  end loop;

  insert into orders (
    id, order_number, customer_name, customer_phone, address, notes,
    delivery_date, delivery_time, subtotal, shipping_cost, total, status
  ) values (
    v_order_id,
    v_order_number,
    p_order->>'customer_name',
    p_order->>'customer_phone',
    p_order->>'address',
    nullif(p_order->>'notes', ''),
    (p_order->>'delivery_date')::date,
    p_order->>'delivery_time',
    coalesce((p_order->>'subtotal')::numeric, 0),
    coalesce((p_order->>'shipping_cost')::numeric, 0),
    coalesce((p_order->>'total')::numeric, 0),
    'pending_payment'
  );

  if p_items is not null then
    for v_item in select * from jsonb_array_elements(p_items)
    loop
      v_product_id := null;
      begin
        if (v_item->>'product_id') is not null then
          v_product_id := (v_item->>'product_id')::uuid;
          if not exists (select 1 from products where id = v_product_id) then
            v_product_id := null;
          end if;
        end if;
      exception when others then
        v_product_id := null;
      end;

      insert into order_items (order_id, product_id, quantity, unit_price, subtotal)
      values (
        v_order_id,
        v_product_id,
        coalesce((v_item->>'quantity')::int, 1),
        coalesce((v_item->>'unit_price')::numeric, 0),
        coalesce((v_item->>'subtotal')::numeric, 0)
      );
    end loop;
  end if;

  if p_payment_method is not null then
    insert into payments (order_id, method, validated)
    values (v_order_id, p_payment_method::payment_method, false);
  end if;

  return v_order_number;
end;
$$;

revoke all on function public.create_order(jsonb, jsonb, text) from public;
grant execute on function public.create_order(jsonb, jsonb, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- product_soft_delete: eliminado lógico. Solo marca el producto como
-- eliminado (y no disponible) si NO está ligado a pedidos activos
-- (estados distintos de delivered/cancelled). Devuelve false si no se
-- puede eliminar por estar en pedidos en curso.
-- ---------------------------------------------------------------------
create or replace function public.product_soft_delete(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'No autorizado';
  end if;

  if exists (
    select 1 from order_items oi
    join orders o on o.id = oi.order_id
    where oi.product_id = p_id
      and o.status not in ('delivered','cancelled')
  ) then
    return false;
  end if;

  update products set deleted = true, available = false where id = p_id;
  return true;
end;
$$;

revoke all on function public.product_soft_delete(uuid) from public;
grant execute on function public.product_soft_delete(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- admin_dashboard_metrics: métricas agregadas para el panel admin.
-- SECURITY DEFINER con guarda is_admin() para no exponer datos.
-- ---------------------------------------------------------------------
create or replace function public.admin_dashboard_metrics()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  if not is_admin() then
    raise exception 'No autorizado';
  end if;

  select json_build_object(
    'orders_total', (select count(*) from orders),
    'pending', (select count(*) from orders where status = 'pending_payment'),
    'validated', (select count(*) from orders where status = 'payment_validated'),
    'preparing', (select count(*) from orders where status = 'preparing'),
    'on_the_way', (select count(*) from orders where status = 'on_the_way'),
    'delivered', (select count(*) from orders where status = 'delivered'),
    'cancelled', (select count(*) from orders where status = 'cancelled'),
    'active', (select count(*) from orders where status not in ('delivered','cancelled')),
    'revenue', (select coalesce(sum(total),0) from orders where status <> 'cancelled'),
    'revenue_month', (select coalesce(sum(total),0) from orders where status <> 'cancelled' and date_trunc('month', created_at) = date_trunc('month', now())),
    'avg_ticket', (select coalesce(round(avg(total)),0) from orders where status <> 'cancelled'),
    'customers', (select count(distinct customer_phone) from orders),
    'sales_7d', (
      select coalesce(json_agg(s order by s.day), '[]'::json) from (
        select to_char(d, 'YYYY-MM-DD') as day,
          coalesce((select sum(o.total) from orders o where o.created_at::date = d::date and o.status <> 'cancelled'),0) as total,
          coalesce((select count(*) from orders o where o.created_at::date = d::date),0) as count
        from generate_series(current_date - interval '6 days', current_date, interval '1 day') d
      ) s
    ),
    'top_products', (
      select coalesce(json_agg(tp), '[]'::json) from (
        select coalesce(nullif(trim(p.name || ' ' || coalesce(p.description, '')), ''), 'Producto') as name,
               sum(oi.quantity) as qty
        from order_items oi
        join products p on p.id = oi.product_id
        join orders o on o.id = oi.order_id and o.status <> 'cancelled'
        group by 1
        order by qty desc
        limit 5
      ) tp
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_dashboard_metrics() from public;
grant execute on function public.admin_dashboard_metrics() to authenticated;

-- ---------------------------------------------------------------------
-- Datos iniciales: bandejas predefinidas del MVP.
-- ---------------------------------------------------------------------
insert into public.products (name, description, price, available, kind, tray_count)
values
  ('Bandeja 25', 'Empanadas de pollo', 25000, true, 'tray', 1),
  ('Bandeja 50', 'Empanadas de pollo', 45000, true, 'tray', 1),
  ('Bandeja 25', 'Deditos de queso', 38000, true, 'tray', 1),
  ('Bandeja Mixta', '25 empanadas + 25 deditos', 48000, true, 'tray', 1)
on conflict do nothing;

insert into public.products (name, description, price, reference_price, tray_count, kind, available)
select * from (values
  ('Combo 50', '25 empanadas + 25 deditos', 58000::numeric, 63000::numeric, 2, 'combo'::product_kind, true),
  ('Combo 100', '50 empanadas + 50 deditos', 110000::numeric, 121000::numeric, 4, 'combo'::product_kind, true),
  ('Combo 150', '75 empanadas + 75 deditos', 165000::numeric, 184000::numeric, 6, 'combo'::product_kind, true)
) as v(name, description, price, reference_price, tray_count, kind, available)
where not exists (select 1 from public.products where kind = 'combo');
