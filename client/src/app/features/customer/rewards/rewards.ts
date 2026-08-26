import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoyaltyService } from '../../../core/services/loyalty.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoyaltyStatusDto } from '../../../core/models';

/**
 * SeeThePrep Rewards — free stamp card + account credit (no subscription required).
 * SRP: displays loyalty status and lets the customer redeem a completed stamp card.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-rewards',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './rewards.html',
  styleUrl: './rewards.scss',
})
export class Rewards implements OnInit {
  private readonly loyalty = inject(LoyaltyService);
  private readonly toast = inject(ToastService);

  readonly status = signal<LoyaltyStatusDto | null>(null);
  readonly loading = signal(true);
  readonly redeeming = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loyalty.getStatus().subscribe({
      next: (s) => {
        this.status.set(s);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.show('Could not load your rewards. Please try again.', 'error');
      },
    });
  }

  get stampsArray(): boolean[] {
    const s = this.status();
    if (!s) return [];
    return Array.from({ length: s.stampsRequiredForReward }, (_, i) => i < s.stampCount);
  }

  redeem(): void {
    this.redeeming.set(true);
    this.loyalty.redeemStamps().subscribe({
      next: (res) => {
        this.redeeming.set(false);
        this.toast.show(res.message, res.success ? 'success' : 'error');
        if (res.success) this.load();
      },
      error: (err) => {
        this.redeeming.set(false);
        this.toast.show(err?.error?.message ?? 'Could not redeem reward', 'error');
      },
    });
  }
}
