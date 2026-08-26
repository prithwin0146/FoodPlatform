import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/customer/restaurant-list/restaurant-list').then((m) => m.RestaurantList),
  },
  {
    path: 'restaurants',
    loadComponent: () =>
      import('./features/customer/restaurants-browse/restaurants-browse').then((m) => m.RestaurantsBrowse),
  },
  {
    path: 'auctions',
    loadComponent: () =>
      import('./features/customer/auctions-browse/auctions-browse').then((m) => m.AuctionsBrowse),
  },
  {
    path: 'auctions/:id',
    loadComponent: () =>
      import('./features/customer/auction-live/auction-live').then((m) => m.AuctionLive),
  },
  {
    path: 'rewards',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/customer/rewards/rewards').then((m) => m.Rewards),
  },
  {
    path: 'plus',
    loadComponent: () =>
      import('./features/customer/plus-landing/plus-landing').then((m) => m.PlusLanding),
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
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/customer/my-orders/my-orders').then((m) => m.MyOrders),
  },
  {
    path: 'orders/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/customer/order-tracking/order-tracking').then((m) => m.OrderTracking),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/customer/profile/profile').then((m) => m.Profile),
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
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./features/auth/verify-email/verify-email').then((m) => m.VerifyEmail),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password').then((m) => m.ResetPassword),
  },
  { path: '**', redirectTo: '' },
];
