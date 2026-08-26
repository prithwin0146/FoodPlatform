import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Auction, Bid, CreateAuctionRequest, UpdateAuctionRequest } from '../models';

/**
 * HTTP wrapper for live auctions — both the public browse/bid endpoints and
 * the staff-only restaurant management endpoints.
 * (SRP: auction HTTP operations only — real-time updates live in AuctionHubService)
 */
@Injectable({ providedIn: 'root' })
export class AuctionService {
  private readonly publicUrl = `${environment.apiUrl}/auctions`;
  private readonly staffUrl = `${environment.apiUrl}/restaurant/auctions`;

  constructor(private readonly http: HttpClient) {}

  // ── Public / customer ──────────────────────────────────────────────
  getLive(): Observable<Auction[]> {
    return this.http.get<Auction[]>(`${this.publicUrl}/live`);
  }

  getById(id: number): Observable<Auction> {
    return this.http.get<Auction>(`${this.publicUrl}/${id}`);
  }

  getBids(id: number): Observable<Bid[]> {
    return this.http.get<Bid[]>(`${this.publicUrl}/${id}/bids`);
  }

  placeBid(id: number, amount: number): Observable<Bid> {
    return this.http.post<Bid>(`${this.publicUrl}/${id}/bids`, { amount });
  }

  getLiveStreamUrl(id: number): Observable<{ hlsUrl: string }> {
    return this.http.get<{ hlsUrl: string }>(`${this.publicUrl}/${id}/live-stream-url`);
  }

  // ── Staff management ────────────────────────────────────────────────
  getAllForRestaurant(): Observable<Auction[]> {
    return this.http.get<Auction[]>(this.staffUrl);
  }

  create(payload: CreateAuctionRequest): Observable<Auction> {
    return this.http.post<Auction>(this.staffUrl, payload);
  }

  update(id: number, payload: UpdateAuctionRequest): Observable<Auction> {
    return this.http.put<Auction>(`${this.staffUrl}/${id}`, payload);
  }

  setCamera(id: number, cameraId: string | null): Observable<Auction> {
    return this.http.put<Auction>(`${this.staffUrl}/${id}/camera`, { cameraId });
  }

  start(id: number, durationMinutes?: number): Observable<Auction> {
    return this.http.post<Auction>(`${this.staffUrl}/${id}/start`, { durationMinutes });
  }

  end(id: number): Observable<Auction> {
    return this.http.post<Auction>(`${this.staffUrl}/${id}/end`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.staffUrl}/${id}`);
  }
}
