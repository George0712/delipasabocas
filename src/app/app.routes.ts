import { Routes } from '@angular/router';

import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home').then((m) => m.Home),
    title: 'DeliPasabocas | Elige tu pasabocas',
  },
  {
    path: 'pedido',
    loadComponent: () =>
      import('./features/order/custom-order').then((m) => m.CustomOrder),
    title: 'Pedido personalizado | DeliPasabocas',
  },
  {
    path: 'entrega',
    loadComponent: () =>
      import('./features/checkout/delivery').then((m) => m.Delivery),
    title: 'Información de entrega | DeliPasabocas',
  },
  {
    path: 'pago',
    loadComponent: () =>
      import('./features/checkout/payment').then((m) => m.Payment),
    title: 'Pago | DeliPasabocas',
  },
  {
    path: 'confirmacion',
    loadComponent: () =>
      import('./features/confirmation/confirmation').then(
        (m) => m.Confirmation,
      ),
    title: 'Pedido recibido | DeliPasabocas',
  },
  {
    path: 'seguimiento',
    loadComponent: () =>
      import('./features/tracking/tracking').then((m) => m.Tracking),
    title: 'Seguimiento | DeliPasabocas',
  },
  {
    path: 'seguimiento/:orderNumber',
    loadComponent: () =>
      import('./features/tracking/tracking').then((m) => m.Tracking),
    title: 'Seguimiento | DeliPasabocas',
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/login/login').then((m) => m.Login),
    title: 'Ingresar | Admin',
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin-layout').then((m) => m.AdminLayout),
    canActivate: [adminGuard],
    canActivateChild: [adminGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard').then(
            (m) => m.Dashboard,
          ),
        title: 'Dashboard | Admin',
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./features/admin/orders/orders').then((m) => m.Orders),
        title: 'Pedidos | Admin',
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./features/admin/products/products-admin').then(
            (m) => m.ProductsAdmin,
          ),
        title: 'Productos | Admin',
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./features/admin/settings/settings').then((m) => m.Settings),
        title: 'Configuración | Admin',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
