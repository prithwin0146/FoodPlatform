import { Pipe, PipeTransform } from '@angular/core';

/**
 * Derives a representative emoji from a restaurant or menu item name.
 * (SRP: display logic extracted from multiple components into one reusable pipe)
 */
@Pipe({ name: 'restaurantEmoji', standalone: true })
export class RestaurantEmojiPipe implements PipeTransform {
  private static readonly EMOJIS = ['🍛', '🍕', '🍔', '🌮', '🍜', '🍣', '🥘', '🍲'];

  transform(name: string): string {
    const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return RestaurantEmojiPipe.EMOJIS[hash % RestaurantEmojiPipe.EMOJIS.length];
  }
}

/**
 * Derives a representative emoji for a menu item name.
 */
@Pipe({ name: 'menuItemEmoji', standalone: true })
export class MenuItemEmojiPipe implements PipeTransform {
  private static readonly EMOJIS = ['🍛', '🥗', '🍗', '🥘', '🍲', '🌶️', '🧀', '🥙', '🍰', '☕'];

  transform(name: string): string {
    const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return MenuItemEmojiPipe.EMOJIS[hash % MenuItemEmojiPipe.EMOJIS.length];
  }
}
