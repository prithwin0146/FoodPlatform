import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { INFO_PAGES, type InfoPageContent } from './info-content';

/**
 * SRP: renders one informational page resolved from the :slug route param.
 * OCP: new pages added by appending to INFO_PAGES — no component change.
 * DIP: depends on ActivatedRoute abstraction; content via injected data module.
 */
@Component({
  selector: 'app-info-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './info-page.html',
  styleUrl: './info-page.scss',
})
export class InfoPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly slug = toSignal(this.route.paramMap, { requireSync: true });

  readonly content = computed<InfoPageContent>(() => {
    const slug = this.slug().get('slug') ?? '';
    const found = INFO_PAGES[slug];
    if (found) return found;
    return {
      slug,
      eyebrow: 'Page',
      title: 'Page not found',
      intro: 'The page you\'re looking for doesn\'t exist yet. Try the sitemap or head back home.',
      sections: [],
    };
  });

  goBack(): void {
    this.router.navigateByUrl('/');
  }
}
