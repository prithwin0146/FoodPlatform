import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Force scroll-to-top on refresh (overrides browser's restore-scroll behaviour)
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.addEventListener('beforeunload', () => window.scrollTo(0, 0));

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
