import { Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AdminOrderService } from '../../../core/services/admin-order.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order } from '../../../core/models';

/**
 * Responsible only for displaying and resolving disputed orders.
 * (SRP: split from AdminPanel god component)
 */
@Component({
  selector: 'app-admin-disputes-tab',
  standalone: true,
  imports: [CurrencyPipe, MatCardModule, MatButtonModule, MatChipsModule, MatProgressBarModule],
  template: `
    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }
    @if (!loading() && disputes().length === 0) {
      <div class="empty-card">
        <span class="material-symbols-rounded empty-icon">check_circle</span>
        <h3>No disputed orders</h3>
        <p>All clear — no disputes require your attention right now.</p>
      </div>
    } @else {
      <div class="disputes-grid">
        @for (o of disputes(); track o.id) {
          <mat-card class="dispute-card">
            <mat-card-header>
              <mat-card-title>
                Order #{{ o.id }}
                <mat-chip class="chip-disputed" disableRipple>Disputed</mat-chip>
              </mat-card-title>
              <mat-card-subtitle>{{ o.totalAmount | currency:'GBP' }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p class="dispute-notes">{{ o.disputeNotes || 'No additional notes provided.' }}</p>
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-flat-button color="warn" (click)="refund(o.id)">
                <span class="material-symbols-rounded" style="font-size:18px;vertical-align:middle;margin-right:4px">payments</span>
                Issue Refund
              </button>
            </mat-card-actions>
          </mat-card>
        }
      </div>
    }
  `,
  styles: [`
    .disputes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }

    .dispute-card {
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04);

      mat-card-title { display: flex; align-items: center; gap: 10px; font-size: 1rem; font-weight: 700; }
    }

    mat-chip.chip-disputed {
      font-size: 0.7rem !important; font-weight: 700 !important; height: 20px !important;
      background: #ffedd5 !important; color: #9a3412 !important;
    }

    .dispute-notes {
      color: #6b7280;
      font-size: 0.875rem;
      font-style: italic;
      margin: 0;
      line-height: 1.6;
    }

    .empty-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 80px 24px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      text-align: center;

      .empty-icon { font-size: 56px; color: #10b981; }
      h3 { margin: 0; font-size: 1.125rem; font-weight: 700; color: #0f0f13; }
      p { margin: 0; color: #6b7280; font-size: 0.9375rem; }
    }
  `]
})
export class AdminDisputesTab implements OnInit {
  readonly disputes = signal<Order[]>([]);
  readonly loading = signal(true);

  constructor(
    private readonly adminOrderService: AdminOrderService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.adminOrderService.disputedOrders().subscribe({
      next: (o) => { this.disputes.set(o); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load disputes'); this.loading.set(false); },
    });
  }

  refund(orderId: number): void {
    this.adminOrderService.refund(orderId).subscribe({
      next: () => { this.toast.success('Refund issued'); this.ngOnInit(); },
      error: (err) => this.toast.error(err.error?.message ?? 'Failed'),
    });
  }
}

