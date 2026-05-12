import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Server-side rendering route config.
 *
 * Strategy per route:
 *  - Public marketing/info pages → SSR (fresh HTML per request, best for SEO)
 *  - Auth-gated pages → Client-side only (no server render needed, no user data)
 *  - Dynamic restaurant pages → SSR for crawlability of each restaurant
 */
export const serverRoutes: ServerRoute[] = [
  // Homepage — SSR: most important for SEO
  { path: '', renderMode: RenderMode.Server },

  // Restaurant pages — SSR: key for "order from X" search queries
  { path: 'restaurant/:id', renderMode: RenderMode.Server },

  // Info / marketing pages — SSR: all publicly crawlable
  { path: 'info/:slug', renderMode: RenderMode.Server },

  // Auth pages — CSR only: short-lived forms, no SEO value
  { path: 'login',           renderMode: RenderMode.Client },
  { path: 'register',        renderMode: RenderMode.Client },
  { path: 'verify-email',    renderMode: RenderMode.Client },
  { path: 'forgot-password', renderMode: RenderMode.Client },
  { path: 'reset-password',  renderMode: RenderMode.Client },

  // Authenticated pages — CSR only
  { path: 'checkout',        renderMode: RenderMode.Client },
  { path: 'orders/:id',      renderMode: RenderMode.Client },
  { path: 'dashboard',       renderMode: RenderMode.Client },
  { path: 'admin',           renderMode: RenderMode.Client },

  // Wildcard fallback
  { path: '**',              renderMode: RenderMode.Client },
];
