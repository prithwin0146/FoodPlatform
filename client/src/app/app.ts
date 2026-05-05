import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './shared/components/header/header';
import { Toast } from './shared/components/toast/toast';
import { trigger, transition, style, animate, query, group } from '@angular/animations';

const ENTER = [
  style({ opacity: 0, transform: 'translateY(12px)' }),
  animate('340ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' })),
];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Toast],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  animations: [
    trigger('routeAnim', [
      // Initial page load: void → any named state
      transition('void => *', [
        query(':enter', ENTER, { optional: true }),
      ]),
      // Navigation between pages
      transition('* => *', [
        group([
          query(':leave', [
            animate('180ms ease-in', style({ opacity: 0 })),
          ], { optional: true }),
          query(':enter', ENTER, { optional: true }),
        ]),
      ]),
    ]),
  ],
})
export class App {
  getRoute(outlet: RouterOutlet): string {
    return outlet.activatedRoute?.snapshot?.url?.[0]?.path ?? 'root';
  }
}
