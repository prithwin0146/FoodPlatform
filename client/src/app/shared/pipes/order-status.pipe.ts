  import { Pipe, PipeTransform } from '@angular/core';
import { OrderStatus } from '../../core/models';

/**
 * Order-status emoji pipe — intentionally returns an empty string.
 *
 * Emojis were stripped from the UI to keep status chips professional;
 * the chip's colour + label now carry the meaning. Pipe is kept so
 * existing templates compile unchanged.
 * (SRP: display formatting only.)
 */
@Pipe({ name: 'orderStatusEmoji', standalone: true })
export class OrderStatusEmojiPipe implements PipeTransform {
  transform(_status: OrderStatus | string): string { return ''; }
}

/**
 * Formats a camelCase OrderStatus string as human-readable text.
 * e.g. "OutForDelivery" → "Out For Delivery"
 */
@Pipe({ name: 'orderStatusLabel', standalone: true })
export class OrderStatusLabelPipe implements PipeTransform {
  transform(status: string): string {
    return status.replace(/([A-Z])/g, ' $1').trim();
  }
}

/**
 * Maps a hygiene rating number to a descriptive label.
 */
@Pipe({ name: 'hygieneLabel', standalone: true })
export class HygieneLabelPipe implements PipeTransform {
  transform(rating: number): string {
    if (rating === 5) return 'Excellent';
    if (rating === 4) return 'Good';
    if (rating === 3) return 'Fair';
    return 'Needs Improvement';
  }
}

/** Dietary tag icon pipe — emojis suppressed for professional UI. */
@Pipe({ name: 'dietaryIcon', standalone: true })
export class DietaryIconPipe implements PipeTransform {
  transform(_tag: string): string { return ''; }
}
