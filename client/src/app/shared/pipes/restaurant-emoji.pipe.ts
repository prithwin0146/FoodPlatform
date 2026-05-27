import { Pipe, PipeTransform } from '@angular/core';

/**
 * Restaurant / menu-item emoji pipes.
 *
 * Historically these produced decorative emojis (🍕🍔…) for display.
 * They now intentionally return an empty string — emojis were removed
 * from the UI to maintain a professional, premium visual language.
 * Pipes are kept (rather than deleted) so existing templates compile
 * unchanged. Re-enable by editing here only.
 * (SRP: display logic in one place. OCP: extend by editing this file.)
 */
@Pipe({ name: 'restaurantEmoji', standalone: true })
export class RestaurantEmojiPipe implements PipeTransform {
  transform(_name: string): string { return ''; }
}

@Pipe({ name: 'menuItemEmoji', standalone: true })
export class MenuItemEmojiPipe implements PipeTransform {
  transform(_name: string): string { return ''; }
}
