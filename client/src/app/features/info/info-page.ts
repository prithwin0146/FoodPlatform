import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { INFO_PAGES, type InfoPageContent } from './info-content';
import { CanonicalService } from '../../core/services/canonical.service';

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
  private readonly titleSvc = inject(Title);
  private readonly metaSvc = inject(Meta);
  private readonly doc = inject(DOCUMENT);
  private readonly canonicalSvc = inject(CanonicalService);

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

  constructor() {
    effect(() => {
      const c = this.content();
      this.titleSvc.setTitle(`${c.title} | SeeThePrep`);
      this.metaSvc.updateTag({ name: 'description', content: c.intro.slice(0, 160) });
      this.metaSvc.updateTag({ property: 'og:title', content: `${c.title} | SeeThePrep` });
      this.metaSvc.updateTag({ property: 'og:description', content: c.intro.slice(0, 200) });
      this.metaSvc.updateTag({ property: 'og:url', content: `https://seetheprep.com/info/${c.slug}` });
      this.metaSvc.updateTag({ name: 'robots', content: c.slug === 'do-not-sell' ? 'noindex' : 'index, follow' });
      this.canonicalSvc.set(`https://seetheprep.com/info/${c.slug}`);

      // Inject breadcrumb JSON-LD (replace previous if exists)
      const prev = this.doc.querySelector('script[data-info-breadcrumb]');
      if (prev) prev.remove();
      const script = this.doc.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-info-breadcrumb', '');
      script.text = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://seetheprep.com/' },
          { '@type': 'ListItem', position: 2, name: c.title, item: `https://seetheprep.com/info/${c.slug}` },
        ],
      });
      this.doc.head.appendChild(script);
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/');
  }
}
