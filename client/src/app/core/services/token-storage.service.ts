import { Injectable } from '@angular/core';

const TOKEN_KEY = 'fp_token';
const USER_KEY = 'fp_user';

/**
 * Responsible solely for token persistence in localStorage.
 * (SRP: storage concern extracted from AuthService)
 * (DIP: AuthService and AuthInterceptor depend on this abstraction, not localStorage directly)
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUser<T>(): T | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  save(token: string, user: object): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
