import { Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AdminOrderService } from '../../../core/services/admin-order.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order } from '../../../core/models';

/**
 * Responsible only for displaying and managing orders in the admin panel.
 * (SRP: split from AdminPanel god component)
 */
@Component({
  selector: 'app-admin-orders-tab',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, MatTableModule, MatChipsModule, MatCardModule, MatProgressBarModule],
  template: `
    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }
    <mat-card class="orders-card">
      <mat-card-header>
        <mat-card-title>
          <span class="material-symbols-rounded">receipt_long</span>
          All Orders
        </mat-card-title>
        <mat-card-subtitle>{{ orders().length }} total orders across all restaurants</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        @if (orders().length === 0 && !loading()) {
          <div class="empty-state">
            <span class="material-symbols-rounded empty-icon">inbox</span>
            <p>No orders found</p>
          </div>
        } @else {
          <div class="table-wrap">
            <table mat-table [dataSource]="orders()" class="orders-table">
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef>Order #</th>
                <td mat-cell *matCellDef="let o"><strong>#{{ o.id }}</strong></td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let o">
                  <mat-chip [class]="'chip-' + o.status.toLowerCase()" disableRipple>
                    {{ o.status }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef>Total</th>
                <td mat-cell *matCellDef="let o">{{ o.totalAmount | currency:'GBP' }}</td>
              </ng-container>

              <ng-container matColumnDef="items">
                <th mat-header-cell *matHeaderCellDef>Items</th>
                <td mat-cell *matCellDef="let o">{{ o.items.length }}</td>
              </ng-container>

              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let o" class="date-cell">{{ o.createdAt | date:'d MMM y, HH:mm' }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="cols"></tr>
              <tr mat-row *matRowDef="let row; columns: cols;"></tr>
            </table>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .orders-card {
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04);

      mat-card-header { padding: 24px 24px 0; }
      mat-card-title { display: flex; align-items: center; gap: 10px; font-size: 1rem; font-weight: 700; color: #0f0f13; }
      mat-card-subtitle { margin-top: 4px; }
      .material-symbols-rounded { font-size: 20px; color: #6b7280; }
      mat-card-content { padding: 16px 0 0; }
    }

    .table-wrap { overflow-x: auto; }

    .orders-table {
      width: 100%;
      th { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.06em; }
      td, th { padding: 14px 24px; }
      tr:last-child td { border-bottom: none; }
      strong { font-weight: 700; color: #0f0f13; }
      .date-cell { color: #6b7280; font-size: 0.875rem; }
    }

    mat-chip {
      font-size: 0.75rem !important; font-weight: 600 !important; height: 24px !important;
      &.chip-pending { background: #fef3c7 !important; color: #92400e !important; }
      &.chip-accepted { background: #dbeafe !important; color: #1e40af !important; }
      &.chip-preparing { background: #ede9fe !important; color: #5b21b6 !important; }
      &.chip-outfordelivery { background: #fce7f3 !important; color: #9d174d !important; }
      &.chip-delivered { background: #d1fae5 !important; color: #065f46 !important; }
      &.chip-rejected { background: #fee2e2 !important; color: #991b1b !important; }
      &.chip-cancelled { background: #f3f4f6 !important; color: #6b7280 !important; }
      &.chip-disputed { background: #ffedd5 !important; color: #9a3412 !important; }
    }

    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      padding: 64px 24px; color: #9ca3af;
      .empty-icon { font-size: 48px; }
      p { margin: 0; font-size: 0.9375rem; }
    }
  `]
})
export class AdminOrdersTab implements OnInit {
  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly cols = ['id', 'status', 'total', 'items', 'date'];

  constructor(
    private readonly adminOrderService: AdminOrderService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.adminOrderService.allOrders().subscribe({
      next: (o) => { this.orders.set(o); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load orders'); this.loading.set(false); },
    });
  }
}

