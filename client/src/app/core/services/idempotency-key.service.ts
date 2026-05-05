import { Injectable } from '@angular/core';

/**
 * Generates idempotency keys for order submissions.
 * (SRP: extracted from Checkout component — utility concerns don't belong in UI components)
 */
@Injectable({ providedIn: 'root' })
export class IdempotencyKeyService {
  generate(): string {
    return crypto.randomUUID?.()
      ?? Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
