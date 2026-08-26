import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoyaltyStatusDto, RedeemStampRewardResponse } from '../models';

/**
 * SeeThePrep Rewards — free stamp + account-credit loyalty program.
 * (SRP: HTTP calls only — no state management)
 */
@Injectable({ providedIn: 'root' })
export class LoyaltyService {
  private readonly url = `${environment.apiUrl}/loyalty`;

  constructor(private readonly http: HttpClient) {}

  getStatus(): Observable<LoyaltyStatusDto> {
    return this.http.get<LoyaltyStatusDto>(`${this.url}/status`);
  }

  redeemStamps(): Observable<RedeemStampRewardResponse> {
    return this.http.post<RedeemStampRewardResponse>(`${this.url}/redeem-stamps`, {});
  }
}
