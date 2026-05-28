import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PromoCode, ValidatePromoCodeResponse, CreatePromoCodeRequest } from '../models';

/**
 * HTTP wrapper for promo code validation (customer) and admin CRUD.
 * (SRP: promo code HTTP operations only)
 */
@Injectable({ providedIn: 'root' })
export class PromoCodeService {
  private readonly url = `${environment.apiUrl}/promo`;
  private readonly adminUrl = `${environment.apiUrl}/admin/promo-codes`;

  constructor(private readonly http: HttpClient) {}

  validate(code: string, orderTotal: number): Observable<ValidatePromoCodeResponse> {
    return this.http.post<ValidatePromoCodeResponse>(`${this.url}/validate`, { code, orderTotal });
  }

  // Admin
  getAll(): Observable<PromoCode[]> {
    return this.http.get<PromoCode[]>(this.adminUrl);
  }

  create(payload: CreatePromoCodeRequest): Observable<PromoCode> {
    return this.http.post<PromoCode>(this.adminUrl, payload);
  }

  update(id: number, payload: Partial<CreatePromoCodeRequest & { isActive: boolean }>): Observable<PromoCode> {
    return this.http.put<PromoCode>(`${this.adminUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}`);
  }
}
