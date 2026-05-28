import { Injectable, inject, OnDestroy } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from './token-storage.service';

export interface OrderStatusChangedPayload {
  id: number;
  hashId: string;
  status: string;
  estimatedDeliveryTime?: string | null;
  rejectionReason?: string | null;
}

/**
 * Manages the SignalR WebSocket connection to /hubs/orders.
 * (SRP: connection lifecycle + event relay only — no business logic)
 * (DIP: consumers subscribe to orderStatusChanged$ or newOrder$ streams;
 *  they never touch HubConnection directly)
 */
@Injectable({ providedIn: 'root' })
export class OrderHubService implements OnDestroy {
  private readonly tokenStorage = inject(TokenStorageService);

  private connection: HubConnection | null = null;

  readonly orderStatusChanged$ = new Subject<OrderStatusChangedPayload>();
  readonly newOrder$ = new Subject<unknown>();

  private get hubUrl(): string {
    // Replace /api suffix with the hub path — the hub is mounted at the root level
    const base = environment.apiUrl.replace(/\/api$/, '');
    return `${base}/hubs/orders`;
  }

  async connect(): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) return;

    const token = this.tokenStorage.getToken() ?? '';

    this.connection = new HubConnectionBuilder()
      .withUrl(this.hubUrl, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    this.connection.on('OrderStatusChanged', (payload: OrderStatusChangedPayload) => {
      this.orderStatusChanged$.next(payload);
    });

    this.connection.on('NewOrder', (order: unknown) => {
      this.newOrder$.next(order);
    });

    try {
      await this.connection.start();
    } catch (err) {
      console.warn('[OrderHubService] SignalR connection failed — falling back to polling', err);
    }
  }

  async joinOrderGroup(hashId: string): Promise<void> {
    if (this.connection?.state !== HubConnectionState.Connected) return;
    await this.connection.invoke('JoinOrderGroup', hashId);
  }

  async leaveOrderGroup(hashId: string): Promise<void> {
    if (this.connection?.state !== HubConnectionState.Connected) return;
    await this.connection.invoke('LeaveOrderGroup', hashId);
  }

  async joinRestaurantGroup(restaurantId: number): Promise<void> {
    if (this.connection?.state !== HubConnectionState.Connected) return;
    await this.connection.invoke('JoinRestaurantGroup', restaurantId);
  }

  async leaveRestaurantGroup(restaurantId: number): Promise<void> {
    if (this.connection?.state !== HubConnectionState.Connected) return;
    await this.connection.invoke('LeaveRestaurantGroup', restaurantId);
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }

  ngOnDestroy(): void {
    void this.disconnect();
  }
}
