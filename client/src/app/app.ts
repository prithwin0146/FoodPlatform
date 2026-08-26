import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { Header } from './shared/components/header/header';
import { Toast } from './shared/components/toast/toast';
import { FooterComponent } from './shared/components/footer/footer';
import { GoogleAuthService } from './core/auth/google-auth.service';
import { CookieBanner } from './shared/components/cookie-banner/cookie-banner';
import { inject } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, Header, Toast, FooterComponent, CookieBanner],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly transitioning = signal(false);
  private readonly googleAuth = inject(GoogleAuthService);

  constructor(router: Router) {
    router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.transitioning.set(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        // Small delay so the fade-out completes before content swaps
        setTimeout(() => this.transitioning.set(false), 80);
      }
    });

    // Prompt Google One Tap on app load (service handles logged-in check)
    setTimeout(() => this.googleAuth.promptOneTap(), 1000);
  }
}
