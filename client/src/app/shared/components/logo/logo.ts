import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type LogoVariant = 'mark' | 'wordmark' | 'stacked';

/**
 * SeeThePrep brand mark — image-based logo.
 *
 * SOLID:
 *  - SRP: presentational only. Zero DI, zero business logic.
 *  - OCP: size driven by `--brand-size`; variant prop retained for API compatibility.
 */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <img
      src="/logo.png"
      [attr.aria-label]="ariaLabel()"
      [style.height.px]="size()"
      class="logo-img"
      alt="SeeThePrep"
    />
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; }
    .logo-img {
      width: auto;
      display: block;
      object-fit: contain;
    }
  `],
})
export class Logo {
  readonly variant = input<LogoVariant>('wordmark');
  readonly size = input<number>(40);
  readonly showTag = input<boolean>(true);

  readonly ariaLabel = computed(() => 'SeeThePrep');
}
