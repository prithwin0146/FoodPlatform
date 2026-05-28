import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SubscriptionStatus } from '../models';

/**
 * SeeThePrep Plus subscription operations.
 * (SRP: subscription HTTP only — no cart or auth logic)
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly url = `${environment.apiUrl}/subscriptions`;

  constructor(private readonly http: HttpClient) {}

  getStatus(): Observable<SubscriptionStatus> {
    return this.http.get<SubscriptionStatus>(`${this.url}/status`);
  }

  createCheckout(successUrl: string, cancelUrl: string): Observable<{ checkoutUrl: string }> {
    return this.http.post<{ checkoutUrl: string }>(`${this.url}/create-checkout`, { successUrl, cancelUrl });
  }

  cancel(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.url}/cancel`);
  }
}
