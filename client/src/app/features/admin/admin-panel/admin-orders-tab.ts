import { Component, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AdminOrderService } from '../../../core/services/admin-order.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order } from '../../../core/models';

/**
 * Responsible only for displaying and managing orders in the admin panel.
 * (SRP: split from AdminPanel god component; OCP: pagination added without modifying table columns)
 */
@Component({
  selector: 'app-admin-orders-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, FormsModule, MatTableModule, MatChipsModule, MatCardModule,
            MatProgressBarModule, MatButtonModule, MatTooltipModule, MatFormFieldModule, MatInputModule],
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
        <mat-card-subtitle>{{ totalCount() }} total orders across all restaurants</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>

        <!-- ── Search + Status Filter ── -->
        <div class="filter-bar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search orders</mat-label>
            <span matPrefix class="material-symbols-rounded prefix-icon">search</span>
            <input matInput [(ngModel)]="searchText" (ngModelChange)="onSearchChange()" placeholder="Address or item name…" />
            @if (searchText) {
              <button matSuffix mat-icon-button (click)="clearSearch()" matTooltip="Clear">
                <span class="material-symbols-rounded">close</span>
              </button>
            }
          </mat-form-field>
          <div class="status-chips">
            @for (s of statusOptions; track s) {
              <button mat-stroked-button
                [class.active-filter]="activeStatus() === s"
                (click)="setStatus(s)">
                {{ s === '' ? 'All' : s }}
              </button>
            }
          </div>
        </div>

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

          <!-- Pagination Controls -->
          <div class="pagination-row">
            <span class="page-info">
              Page {{ currentPage() }} of {{ totalPages() }}
              ({{ orders().length }} of {{ totalCount() }} orders)
            </span>
            <div class="page-btns">
              <button mat-stroked-button [disabled]="currentPage() <= 1 || loading()" (click)="prevPage()"
                matTooltip="Previous page">
                <span class="material-symbols-rounded">chevron_left</span>
              </button>
              <button mat-stroked-button [disabled]="!hasNextPage() || loading()" (click)="nextPage()"
                matTooltip="Next page">
                <span class="material-symbols-rounded">chevron_right</span>
              </button>
            </div>
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

    /* ── Filter Bar ── */
    .filter-bar {
      display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap;
      padding: 0 24px 12px;
    }
    .search-field { flex: 1; min-width: 220px; }
    .prefix-icon { font-size: 18px; color: #9ca3af; margin-right: 4px; }
    .status-chips {
      display: flex; flex-wrap: wrap; gap: 6px; padding-top: 6px;
      button { font-size: 0.75rem; height: 32px; padding: 0 12px; border-radius: 20px; }
      button.active-filter { background: #0f0f13; color: #fff; border-color: #0f0f13; }
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

    .pagination-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 24px; border-top: 1px solid #f3f4f6;
    }
    .page-info { font-size: 0.875rem; color: #6b7280; }
    .page-btns { display: flex; gap: 8px; }

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
  readonly currentPage = signal(1);
  readonly totalCount = signal(0);
  readonly totalPages = signal(1);
  readonly hasNextPage = computed(() => this.currentPage() < this.totalPages());
  readonly activeStatus = signal('');
  readonly cols = ['id', 'status', 'total', 'items', 'date'];

  searchText = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  readonly statusOptions = ['', 'Pending', 'Accepted', 'Preparing', 'OutForDelivery', 'Delivered', 'Rejected', 'Cancelled', 'Disputed'];
  private readonly PAGE_SIZE = 50;

  constructor(
    private readonly adminOrderService: AdminOrderService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadPage(1);
  }

  private loadPage(page: number): void {
    this.loading.set(true);
    const status = this.activeStatus() || undefined;
    const search = this.searchText.trim() || undefined;
    this.adminOrderService.allOrders(page, this.PAGE_SIZE, status, search).subscribe({
      next: (result) => {
        this.orders.set(result.items);
        this.totalCount.set(result.totalCount);
        this.totalPages.set(result.totalPages);
        this.currentPage.set(result.page);
        this.loading.set(false);
      },
      error: () => { this.toast.error('Failed to load orders'); this.loading.set(false); },
    });
  }

  setStatus(status: string): void {
    this.activeStatus.set(status);
    this.loadPage(1);
  }

  onSearchChange(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadPage(1), 400);
  }

  clearSearch(): void {
    this.searchText = '';
    this.loadPage(1);
  }

  nextPage(): void {
    if (this.hasNextPage()) this.loadPage(this.currentPage() + 1);
  }

  prevPage(): void {
    if (this.currentPage() > 1) this.loadPage(this.currentPage() - 1);
  }
}
