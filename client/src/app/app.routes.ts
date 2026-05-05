import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/customer/restaurant-list/restaurant-list').then((m) => m.RestaurantList),
  },
  {
    path: 'restaurant/:id',
    loadComponent: () =>
      import('./features/customer/restaurant-menu/restaurant-menu').then((m) => m.RestaurantMenu),
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/customer/checkout/checkout').then((m) => m.Checkout),
  },
  {
    path: 'orders/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/customer/order-tracking/order-tracking').then((m) => m.OrderTracking),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'dashboard',
    canActivate: [roleGuard('Staff')],
    loadComponent: () =>
      import('./features/staff/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'admin',
    canActivate: [roleGuard('Admin')],
    loadComponent: () =>
      import('./features/admin/admin-panel/admin-panel').then((m) => m.AdminPanel),
  },
  {
    path: 'info/:slug',
    loadComponent: () =>
      import('./features/info/info-page').then((m) => m.InfoPage),
  },
  { path: '**', redirectTo: '' },
];
