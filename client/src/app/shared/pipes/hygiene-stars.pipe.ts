import { Pipe, PipeTransform } from '@angular/core';

/**
 * Renders a hygiene rating as star characters.
 * (SRP: display logic extracted from multiple components into one reusable pipe)
 * (OCP: change formatting here once — all consumers update automatically)
 */
@Pipe({ name: 'hygieneStars', standalone: true })
export class HygieneStarsPipe implements PipeTransform {
  transform(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}
