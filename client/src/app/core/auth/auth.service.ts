import { Injectable, signal, computed } from '@angular/core';
import { AuthResponse } from '../models';
import { TokenStorageService } from '../services/token-storage.service';

/**
 * Manages the in-memory authentication session (signals).
 * (SRP: no longer owns token storage — delegated to TokenStorageService)
 * (DIP: Router removed — navigation after logout is the caller's responsibility)
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<AuthResponse | null>(null);

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly role = computed(() => this._user()?.role ?? null);
  readonly username = computed(() => this._user()?.username ?? null);
  readonly isCustomer = computed(() => this.role() === 'Customer');
  readonly isStaff = computed(() => this.role() === 'Staff');
  readonly isAdmin = computed(() => this.role() === 'Admin');
  readonly restaurantId = computed(() => this._user()?.restaurantId ?? null);

  constructor(private readonly storage: TokenStorageService) {
    // Rehydrate from persistent storage on construction.
    // Self-heal: sessions saved before `username` existed are stale — drop them.
    const persisted = storage.getUser<AuthResponse>();
    if (persisted && !persisted.username) {
      storage.clear();
      this._user.set(null);
    } else {
      this._user.set(persisted);
    }
  }

  /** Exposed for the HTTP interceptor only. */
  getToken(): string | null {
    return this.storage.getToken();
  }

  setSession(auth: AuthResponse): void {
    this.storage.save(auth.token, auth);
    this._user.set(auth);
  }

  /** Clears session state. Callers (e.g. Header component) are responsible for navigation. */
  clearSession(): void {
    this.storage.clear();
    this._user.set(null);
  }
}
