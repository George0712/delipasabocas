# DELIPASABOCAS - DOCUMENTO MAESTRO DEL PROYECTO

## Puesta en Marcha

Requisitos: Node.js 20+ y npm.

1. Instalar dependencias:
  ```bash
   npm install
  ```
2. Configurar Supabase: crea un proyecto en Supabase y ejecuta el script
  `supabase/schema.sql` en el SQL Editor. Luego coloca la URL y la anon key
   en `src/environments/environment.ts` y `environment.development.ts`.
3. Levantar el servidor de desarrollo:
  ```bash
   npm start
  ```
   App cliente en `http://localhost:4200/` y panel en `http://localhost:4200/admin`.
4. Compilar para producción:
  ```bash
   npm run build
  ```

> La app funciona sin Supabase configurado usando un catálogo de respaldo y
> números de pedido locales, ideal para demostrar el flujo de extremo a extremo.

---

## Descripción General

DeliPasabocas es una plataforma web de pedidos diseñada para facilitar la compra de bandejas de empanadas, deditos de queso y futuros productos para eventos y celebraciones.

El objetivo principal es permitir que un cliente realice un pedido en menos de un minuto desde su teléfono móvil, minimizando la navegación y eliminando cualquier complejidad innecesaria.

El sistema tendrá dos módulos principales:

1. Aplicación para clientes.
2. Panel administrativo.

La primera versión estará enfocada exclusivamente en Malambo, Atlántico.

---

# Filosofía del Producto

## Principios

### Simplicidad extrema

El usuario no debe explorar un catálogo complejo.

Debe ingresar y comenzar inmediatamente el proceso de pedido.

### Mobile First

La experiencia principal será móvil.

La mayoría de usuarios llegarán desde:

- WhatsApp
- Estados de WhatsApp
- Facebook
- Instagram

### Conversión antes que contenido

No se desarrollarán:

- Landing pages extensas
- Blogs
- Secciones corporativas
- Navegación compleja

La prioridad es generar pedidos.

### Escalabilidad sin complejidad

Aunque el MVP será simple, la arquitectura debe permitir:

- Más productos
- Más categorías
- Más municipios
- Pagos automáticos
- Sistema de clientes
- Fidelización

Sin necesidad de reescribir el proyecto.

---

# Objetivos del MVP

## Cliente

Permitir:

- Ver productos disponibles.
- Seleccionar bandejas predefinidas.
- Realizar pedidos personalizados para eventos.
- Programar fecha de entrega.
- Programar hora aproximada.
- Elegir método de pago.
- Adjuntar comprobante opcional.
- Confirmar pedido.
- Contactar vía WhatsApp.

## Administración

Permitir:

- Gestionar pedidos.
- Gestionar productos.
- Validar pagos.
- Cambiar estados.
- Consultar métricas básicas.

---

# Stack Tecnológico

## Frontend

Angular 20

Características:

- Standalone Components
- Signals
- Lazy Loading
- Typed Forms

## UI

Tailwind CSS

Opcional:

- Angular CDK
- Angular Material (solo componentes puntuales)

## Backend

Supabase

Servicios utilizados:

- PostgreSQL
- Auth
- Storage
- Row Level Security

## Hosting

Frontend:

- Cloudflare Pages

Backend:

- Supabase

## Control de versiones

Git + GitHub

---

# Arquitectura General

Frontend Angular

↓

Supabase API

↓

PostgreSQL

↓

Storage

La aplicación debe consumir exclusivamente servicios desacoplados.

No se deben realizar consultas directas desde componentes.

---

# Arquitectura Frontend

src/

├── core/

├── shared/

├── features/

│   ├── home/

│   ├── products/

│   ├── order/

│   ├── checkout/

│   ├── confirmation/

│   ├── admin/

│   ├── dashboard/

│   └── settings/

│

├── assets/

└── environments/

## Reglas

### Core

Contiene:

- Servicios globales
- Guards
- Configuración
- Layouts

### Shared

Contiene:

- Componentes reutilizables
- Pipes
- Directivas
- Utilidades

### Features

Cada funcionalidad debe estar aislada.

No se permiten dependencias cruzadas innecesarias.

---

# Flujo del Cliente

## Paso 1

Selección de producto

Opciones:

- Bandeja 25 empanadas
- Bandeja 50 empanadas
- Bandeja 25 deditos
- Bandeja 50 deditos
- Bandeja mixta
- Pedido personalizado

---

## Paso 2

Información de entrega

Campos:

- Nombre
- Teléfono
- Dirección
- Observaciones
- Fecha
- Hora

---

## Paso 3

Pago

Métodos:

- Nequi
- Bancolombia

Mostrar:

- QR
- Número de cuenta

Permitir:

- Adjuntar comprobante

---

## Paso 4

Confirmación

Mostrar:

- Número de pedido
- Resumen
- Estado inicial

Botones:

- WhatsApp
- Nuevo pedido

---

# Panel Administrativo

## Dashboard

Indicadores:

- Pedidos pendientes
- Pedidos confirmados
- Pedidos entregados
- Ventas del mes

---

## Gestión de Pedidos

Listado:

- Pedido
- Cliente
- Fecha
- Total
- Estado

Estados:

- Pendiente Pago
- Pago Validado
- En Preparación
- En Camino
- Entregado
- Cancelado

---

## Gestión de Productos

CRUD completo

Campos:

- Nombre
- Descripción
- Precio
- Imagen
- Disponible

---

## Métricas

Mostrar:

- Ventas diarias
- Ventas mensuales
- Productos más vendidos
- Clientes recurrentes

---

# Base de Datos

## products

id

name

description

price

image_url

available

created_at

updated_at

---

## orders

id

order_number

customer_name

customer_phone

address

delivery_date

delivery_time

subtotal

shipping_cost

total

status

created_at

updated_at

---

## order_items

id

order_id

product_id

quantity

unit_price

subtotal

---

## payments

id

order_id

method

receipt_url

validated

validated_at

---

## status_history

id

order_id

status

created_at

---

# Diseño UI/UX

## Objetivos

- Moderno
- Limpio
- Rápido
- Mobile First

## Referencias

Inspirarse en:

- Rappi
- Uber Eats
- PedidosYa

Pero simplificado.

## Restricciones

NO crear:

- Menú hamburguesa complejo
- Landing page corporativa
- Múltiples niveles de navegación

El flujo principal debe estar visible desde la primera pantalla.

---

# Roadmap Futuro

## Fase 2

Automatización de pagos

Integraciones:

- Wompi
- Nequi

---

## Fase 3

Nuevos productos

- Picadas
- Pasabocas premium
- Bebidas

---

## Fase 4

Promociones

- Cupones
- Descuentos
- Campañas

---

## Fase 5

Fidelización

- Historial
- Recompensas
- Clientes frecuentes

---

# Reglas para Cursor / Claude

## Calidad de Código

Generar código:

- Tipado
- Modular
- Escalable
- Reutilizable

## Angular

Usar:

- Standalone Components
- Signals
- Control Flow
- Typed Forms

Evitar:

- NgModules innecesarios
- Código duplicado
- Lógica compleja en componentes

## Servicios

Toda lógica de negocio debe vivir en servicios.

Los componentes deben enfocarse únicamente en la presentación.

## Nomenclatura

Seguir convenciones consistentes:

- kebab-case para archivos
- PascalCase para clases
- camelCase para variables

## Escalabilidad

Cada decisión debe considerar que el proyecto crecerá.

Sin embargo:

NO sobreingenierizar.

Siempre priorizar:

1. Simplicidad.
2. Mantenibilidad.
3. Velocidad de desarrollo.
4. Experiencia de usuario.

---

# Meta Final

Construir una plataforma que permita recibir pedidos de manera rápida, sencilla y profesional, mejorando el proceso actual de ventas por WhatsApp y preparando el negocio para crecer de forma organizada.