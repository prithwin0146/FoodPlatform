import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CreatePaymentIntentRequest {
  restaurantId: number;
  items: { menuItemId: number; quantity: number }[];
  idempotencyKey: string;
  orderType?: string;
  promoCode?: string | null;
  giftCardCode?: string | null;
  useAccountCredit?: boolean;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
}

/**
 * HTTP wrapper for the payment-intent endpoint.
 * (SRP: payment API calls only — no Stripe.js interactions)
 */
@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly url = `${environment.apiUrl}/payment-intent`;

  constructor(private readonly http: HttpClient) {}

  createIntent(req: CreatePaymentIntentRequest): Observable<CreatePaymentIntentResponse> {
    return this.http.post<CreatePaymentIntentResponse>(this.url, req);
  }
}
