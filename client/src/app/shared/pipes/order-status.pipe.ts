  import { Pipe, PipeTransform } from '@angular/core';
import { OrderStatus } from '../../core/models';

const STATUS_EMOJI: Record<string, string> = {
  Pending: '⏳', Accepted: '✅', Preparing: '👨‍🍳', Cooking: '🔥',
  Packed: '📦', OutForDelivery: '🚴', Delivered: '🎉',
  Rejected: '❌', Cancelled: '🚫', Cancelling: '⏳',
};

/**
 * Maps an OrderStatus to an emoji.
 * (SRP: extracted from order-tracking and staff-dashboard components)
 * (OCP: add a new status by adding one entry to STATUS_EMOJI — no component changes needed)
 */
@Pipe({ name: 'orderStatusEmoji', standalone: true })
export class OrderStatusEmojiPipe implements PipeTransform {
  transform(status: OrderStatus | string): string {
    return STATUS_EMOJI[status] ?? '📋';
  }
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

/**
 * Maps a dietary tag string to an emoji icon.
 */
@Pipe({ name: 'dietaryIcon', standalone: true })
export class DietaryIconPipe implements PipeTransform {
  private static readonly MAP: Record<string, string> = {
    vegetarian: '🥬', vegan: '🌱', 'gluten-free': '🌾', halal: '☪️', spicy: '🌶️',
  };

  transform(tag: string): string {
    return DietaryIconPipe.MAP[tag.toLowerCase().trim()] ?? '🏷️';
  }
}
