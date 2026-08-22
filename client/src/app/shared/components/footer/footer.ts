import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Logo } from '../logo/logo';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, Logo],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class FooterComponent {
  /**
   * Mobile-only accordion state for the footer nav columns (Eat / Cook /
   * Company / Help). Ignored on desktop — CSS forces columns open there.
   */
  readonly openSections = signal<Set<string>>(new Set());

  toggleSection(name: string): void {
    this.openSections.update(set => {
      const next = new Set(set);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  isSectionOpen(name: string): boolean {
    return this.openSections().has(name);
  }
}
