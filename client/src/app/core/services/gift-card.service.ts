import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GiftCard, ValidateGiftCardResponse } from '../models';

/**
 * Gift card validation and purchase operations.
 * (SRP: gift card HTTP only)
 */
@Injectable({ providedIn: 'root' })
export class GiftCardService {
  private readonly url = `${environment.apiUrl}/gift-cards`;
  private readonly adminUrl = `${environment.apiUrl}/admin/gift-cards`;

  constructor(private readonly http: HttpClient) {}

  validate(code: string): Observable<ValidateGiftCardResponse> {
    return this.http.post<ValidateGiftCardResponse>(`${this.url}/validate`, { code });
  }

  purchase(amount: number, idempotencyKey: string, paymentIntentId?: string): Observable<{ giftCard: GiftCard; clientSecret: string | null }> {
    return this.http.post<{ giftCard: GiftCard; clientSecret: string | null }>(`${this.url}/purchase`, {
      amount, idempotencyKey, paymentIntentId,
    });
  }

  // Admin
  getAll(): Observable<GiftCard[]> {
    return this.http.get<GiftCard[]>(this.adminUrl);
  }

  getByCode(code: string): Observable<GiftCard> {
    return this.http.get<GiftCard>(`${this.adminUrl}/${code}`);
  }
}
