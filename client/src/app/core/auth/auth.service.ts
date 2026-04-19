import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthResponse } from '../models';

const TOKEN_KEY = 'fp_token';
const USER_KEY = 'fp_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<AuthResponse | null>(this.loadUser());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly role = computed(() => this._user()?.role ?? null);
  readonly isCustomer = computed(() => this.role() === 'Customer');
  readonly isStaff = computed(() => this.role() === 'Staff');
  readonly isAdmin = computed(() => this.role() === 'Admin');
  readonly restaurantId = computed(() => this._user()?.restaurantId ?? null);

  constructor(private readonly router: Router) {}

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setSession(auth: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, auth.token);
    localStorage.setItem(USER_KEY, JSON.stringify(auth));
    this._user.set(auth);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  private loadUser(): AuthResponse | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}
