import { Component, Input, ChangeDetectionStrategy, computed, signal } from '@angular/core';

/**
 * Branded gradient + initial letter fallback for restaurant/menu thumbnails.
 * Used when an entity has no <c>imageUrl</c>. Picks a stable gradient from the name
 * so the same restaurant always shows the same colour.
 * (SRP: thumbnail fallback only.)
 */
@Component({
  selector: 'app-image-fallback',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="img-fallback" [style.background]="background()" [attr.aria-label]="name">
      <span class="img-fallback-initial">{{ initial() }}</span>
      <span class="img-fallback-shine" aria-hidden="true"></span>
    </div>
  `,
  styles: [`
    .img-fallback {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: inherit;
    }
    .img-fallback-initial {
      font-family: 'Fraunces', Georgia, serif;
      font-weight: 700;
      font-size: clamp(2rem, 28%, 4.5rem);
      color: rgba(255,255,255,0.92);
      letter-spacing: -0.02em;
      text-shadow: 0 2px 16px rgba(0,0,0,0.18);
      z-index: 2;
    }
    .img-fallback-shine {
      position: absolute;
      inset: -20% auto auto -20%;
      width: 60%;
      height: 140%;
      background: linear-gradient(110deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 60%);
      transform: rotate(15deg);
      z-index: 1;
    }
  `],
})
export class ImageFallback {
  @Input({ required: true }) name = '';
  // tone determines colour family: warm | cool | citrus | berry
  @Input() tone: 'warm' | 'cool' | 'citrus' | 'berry' | 'auto' = 'auto';

  private readonly palettes: Record<string, string> = {
    warm:   'linear-gradient(135deg, #ff7a45 0%, #ff3d8a 100%)',
    cool:   'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
    citrus: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    berry:  'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
    sage:   'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
    sunset: 'linear-gradient(135deg, #f97316 0%, #be185d 100%)',
  };

  readonly initial = computed(() => (this.name?.trim().charAt(0) || '?').toUpperCase());

  readonly background = computed(() => {
    if (this.tone !== 'auto') return this.palettes[this.tone] ?? this.palettes['warm'];
    const keys = Object.keys(this.palettes);
    const sum = (this.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return this.palettes[keys[sum % keys.length]];
  });
}
