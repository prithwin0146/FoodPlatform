import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { AdminAnalyticsService, AnalyticsDto } from '../../../core/services/admin-analytics.service';

/**
 * Displays read-only platform analytics in the admin panel.
 * (SRP: analytics display only — no mutations)
 * (DIP: depends on AdminAnalyticsService, not HttpClient)
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-analytics-tab',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, MatProgressBarModule, MatCardModule],
  template: `
    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @if (analytics(); as a) {
      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-icon material-symbols-rounded">receipt_long</span>
          <div class="kpi-value">{{ a.totalOrders | number }}</div>
          <div class="kpi-label">Total Orders</div>
        </div>
        <div class="kpi-card">
          <span class="kpi-icon material-symbols-rounded">payments</span>
          <div class="kpi-value">{{ a.totalRevenue | currency:'GBP' }}</div>
          <div class="kpi-label">Total Revenue</div>
        </div>
        <div class="kpi-card">
          <span class="kpi-icon material-symbols-rounded">storefront</span>
          <div class="kpi-value">{{ a.activeRestaurants | number }}</div>
          <div class="kpi-label">Active Restaurants</div>
        </div>
        <div class="kpi-card">
          <span class="kpi-icon material-symbols-rounded">avg_pace</span>
          <div class="kpi-value">{{ a.avgOrderValue | currency:'GBP' }}</div>
          <div class="kpi-label">Avg Order Value</div>
        </div>
      </div>

      <!-- Status breakdown -->
      <div class="section-row">
        <mat-card class="breakdown-card">
          <mat-card-header>
            <mat-card-title>
              <span class="material-symbols-rounded">donut_small</span>
              Orders by Status
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="status-list">
              @for (entry of statusEntries(a); track entry.key) {
                <div class="status-row">
                  <span class="status-name">{{ entry.key }}</span>
                  <div class="status-bar-wrap">
                    <div class="status-bar"
                      [style.width.%]="barWidth(entry.value, a.totalOrders)"
                      [class]="'bar-' + entry.key.toLowerCase()">
                    </div>
                  </div>
                  <span class="status-count">{{ entry.value }}</span>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Top restaurants -->
        <mat-card class="top-card">
          <mat-card-header>
            <mat-card-title>
              <span class="material-symbols-rounded">emoji_events</span>
              Top Restaurants by Revenue
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="top-list">
              @for (r of a.topRestaurantsByRevenue; track r.id; let i = $index) {
                <div class="top-row">
                  <span class="top-rank">#{{ i + 1 }}</span>
                  <div class="top-info">
                    <span class="top-name">{{ r.name }}</span>
                    <span class="top-orders">{{ r.orderCount }} orders</span>
                  </div>
                  <span class="top-revenue">{{ r.revenue | currency:'GBP' }}</span>
                </div>
              }
              @if (a.topRestaurantsByRevenue.length === 0) {
                <p class="empty-text">No order data yet.</p>
              }
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    }

    @if (!loading() && !analytics()) {
      <div class="empty-state">
        <span class="material-symbols-rounded empty-icon">analytics</span>
        <p>Could not load analytics.</p>
      </div>
    }
  `,
  styles: [`
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 20px;
      text-align: center;
    }
    .kpi-icon { font-size: 2rem; color: var(--brand-primary); display: block; margin-bottom: 8px; }
    .kpi-value { font-size: 1.6rem; font-weight: 700; color: var(--text-primary); }
    .kpi-label { font-size: 0.78rem; color: var(--text-secondary); margin-top: 4px; text-transform: uppercase; letter-spacing: .05em; }
    .section-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 860px) { .section-row { grid-template-columns: 1fr; } }
    mat-card { background: var(--surface-card) !important; border: 1px solid var(--border-color); border-radius: 14px !important; }
    mat-card-title { display: flex; align-items: center; gap: 8px; font-size: 1rem; font-weight: 600; color: var(--text-primary); }
    mat-card-title .material-symbols-rounded { color: var(--brand-primary); font-size: 1.2rem; }
    .status-list { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
    .status-row { display: flex; align-items: center; gap: 10px; }
    .status-name { width: 130px; font-size: 0.82rem; color: var(--text-secondary); flex-shrink: 0; }
    .status-bar-wrap { flex: 1; height: 8px; background: rgba(255,255,255,.07); border-radius: 4px; overflow: hidden; }
    .status-bar { height: 100%; border-radius: 4px; background: var(--brand-primary); transition: width .4s; }
    .bar-delivered { background: #34d399; }
    .bar-cancelled, .bar-rejected { background: #f87171; }
    .bar-pending { background: #fbbf24; }
    .bar-accepted { background: #60a5fa; }
    .bar-preparing, .bar-cooking { background: #a78bfa; }
    .status-count { font-size: 0.82rem; font-weight: 600; color: var(--text-primary); min-width: 30px; text-align: right; }
    .top-list { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
    .top-row { display: flex; align-items: center; gap: 12px; }
    .top-rank { font-size: 1rem; font-weight: 700; color: var(--brand-primary); min-width: 30px; }
    .top-info { flex: 1; display: flex; flex-direction: column; }
    .top-name { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
    .top-orders { font-size: 0.75rem; color: var(--text-secondary); }
    .top-revenue { font-size: 0.95rem; font-weight: 700; color: #34d399; }
    .empty-state { text-align: center; padding: 48px; color: var(--text-secondary); }
    .empty-icon { font-size: 3rem; display: block; margin-bottom: 12px; }
    .empty-text { color: var(--text-secondary); font-size: 0.875rem; }
  `],
})
export class AdminAnalyticsTab implements OnInit {
  readonly loading = signal(true);
  readonly analytics = signal<AnalyticsDto | null>(null);

  constructor(private readonly analyticsService: AdminAnalyticsService) {}

  ngOnInit(): void {
    this.analyticsService.get().subscribe({
      next: (data) => { this.analytics.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  statusEntries(a: AnalyticsDto): { key: string; value: number }[] {
    return Object.entries(a.ordersByStatus)
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => b.value - a.value);
  }

  barWidth(count: number, total: number): number {
    return total === 0 ? 0 : Math.round((count / total) * 100);
  }
}
