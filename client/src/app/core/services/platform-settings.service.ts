import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Provides access to platform-wide settings stored in the backend.
 * Public endpoint returns all settings for anonymous use (e.g. homepage video).
 * Admin endpoint allows upserting individual settings.
 * (SRP: settings HTTP access only)
 * (DIP: components inject this service, not HttpClient directly)
 */
@Injectable({ providedIn: 'root' })
export class PlatformSettingsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/settings`;
  private readonly adminBase = `${environment.apiUrl}/admin/settings`;

  /** Fetches all public settings as a key→value dictionary. */
  getPublicSettings(): Observable<Record<string, string>> {
    return this.http.get<Record<string, string>>(this.base);
  }

  /** Admin: fetches all settings. */
  getAdminSettings(): Observable<Record<string, string>> {
    return this.http.get<Record<string, string>>(this.adminBase);
  }

  /** Admin: upserts a single setting by key. */
  upsertSetting(key: string, value: string): Observable<void> {
    return this.http.put<void>(`${this.adminBase}/${key}`, { value });
  }
}
