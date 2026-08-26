import { Injectable, inject } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from './token-storage.service';
import { Auction, Bid } from '../models';

/**
 * Manages the SignalR WebSocket connection to /hubs/auctions.
 * (SRP: connection lifecycle + event relay only — no bidding business logic)
 * (DIP: consumers subscribe to bidPlaced$ / auctionEnded$ / auctionStarted$ / auctionUpdated$;
 *  they never touch HubConnection directly)
 */
@Injectable({ providedIn: 'root' })
export class AuctionHubService {
  private readonly tokenStorage = inject(TokenStorageService);

  private connection: HubConnection | null = null;

  readonly bidPlaced$ = new Subject<Bid>();
  readonly auctionStarted$ = new Subject<Auction>();
  readonly auctionUpdated$ = new Subject<Auction>();
  readonly auctionEnded$ = new Subject<Auction>();

  private get hubUrl(): string {
    const base = environment.apiUrl.replace(/\/api$/, '');
    return `${base}/hubs/auctions`;
  }

  async connect(): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) return;

    const token = this.tokenStorage.getToken() ?? '';

    this.connection = new HubConnectionBuilder()
      .withUrl(this.hubUrl, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    this.connection.on('BidPlaced', (bid: Bid) => this.bidPlaced$.next(bid));
    this.connection.on('AuctionStarted', (auction: Auction) => this.auctionStarted$.next(auction));
    this.connection.on('AuctionUpdated', (auction: Auction) => this.auctionUpdated$.next(auction));
    this.connection.on('AuctionEnded', (auction: Auction) => this.auctionEnded$.next(auction));

    try {
      await this.connection.start();
    } catch (err) {
      console.warn('[AuctionHubService] SignalR connection failed', err);
    }
  }

  async disconnect(): Promise<void> {
    await this.connection?.stop();
    this.connection = null;
  }

  async joinAuctionGroup(auctionId: number): Promise<void> {
    if (this.connection?.state !== HubConnectionState.Connected) return;
    await this.connection.invoke('JoinAuctionGroup', auctionId);
  }

  async leaveAuctionGroup(auctionId: number): Promise<void> {
    if (this.connection?.state !== HubConnectionState.Connected) return;
    await this.connection.invoke('LeaveAuctionGroup', auctionId);
  }

  async joinRestaurantAuctionGroup(restaurantId: number): Promise<void> {
    if (this.connection?.state !== HubConnectionState.Connected) return;
    await this.connection.invoke('JoinRestaurantAuctionGroup', restaurantId);
  }

  async leaveRestaurantAuctionGroup(restaurantId: number): Promise<void> {
    if (this.connection?.state !== HubConnectionState.Connected) return;
    await this.connection.invoke('LeaveRestaurantAuctionGroup', restaurantId);
  }
}
