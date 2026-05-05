import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './shared/components/header/header';
import { Toast } from './shared/components/toast/toast';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Toast],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  animations: [
    trigger('routeAnim', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('320ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class App {
  getRoute(outlet: RouterOutlet): string {
    return outlet.activatedRoute?.snapshot?.url?.[0]?.path ?? 'root';
  }
}
