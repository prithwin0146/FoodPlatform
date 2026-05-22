import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminReviewService } from '../../../core/services/admin-review.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaginatedResult, Review } from '../../../core/models';

/**
 * Admin review moderation tab — view and delete reviews platform-wide.
 * (SRP: review moderation only)
 * (DIP: depends on AdminReviewService, not HttpClient directly)
 */
@Component({
  selector: 'app-admin-reviews-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatButtonModule, MatCardModule, MatChipsModule, MatProgressBarModule, MatTooltipModule],
  template: `
    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @if (!loading() && result()?.totalCount === 0) {
      <div class="empty-card">
        <span class="material-symbols-rounded empty-icon">rate_review</span>
        <h3>No reviews yet</h3>
        <p>Customer reviews will appear here once orders have been delivered.</p>
      </div>
    }

    @if (result(); as r) {
      @if (r.totalCount > 0) {
        <div class="reviews-header">
          <span class="reviews-total">{{ r.totalCount }} review{{ r.totalCount !== 1 ? 's' : '' }} on the platform</span>
        </div>

        <div class="reviews-grid">
          @for (review of reviews(); track review.id) {
            <mat-card class="review-card">
              <mat-card-header>
                <mat-card-title class="review-title">
                  <span class="review-avatar">{{ review.customerName.charAt(0).toUpperCase() }}</span>
                  <div class="review-identity">
                    <span class="review-author">{{ review.customerName }}</span>
                    <span class="review-date">{{ review.createdAt | date:'d MMM y' }}</span>
                  </div>
                  <div class="review-stars">
                    @for (s of starsArray(review.stars); track s) {
                      <span class="material-symbols-rounded star-filled">star</span>
                    }
                    @for (s of emptyStars(review.stars); track s) {
                      <span class="material-symbols-rounded star-empty">star</span>
                    }
                  </div>
                </mat-card-title>
                <mat-card-subtitle>Order #{{ review.orderId }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p class="review-comment">{{ review.comment || 'No written comment.' }}</p>
              </mat-card-content>
              <mat-card-actions align="end">
                <button mat-stroked-button color="warn"
                  [disabled]="deletingId() === review.id"
                  (click)="delete(review.id)"
                  matTooltip="Permanently remove this review">
                  <span class="material-symbols-rounded">delete</span>
                  Remove
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>

        <!-- Pagination -->
        @if (r.totalPages > 1) {
          <div class="pagination-row">
            <button mat-stroked-button [disabled]="currentPage() <= 1" (click)="prevPage()">
              <span class="material-symbols-rounded">chevron_left</span> Prev
            </button>
            <span class="page-info">Page {{ currentPage() }} of {{ r.totalPages }}</span>
            <button mat-stroked-button [disabled]="!r.hasNextPage" (click)="nextPage()">
              Next <span class="material-symbols-rounded">chevron_right</span>
            </button>
          </div>
        }
      }
    }
  `,
  styles: [`
    .reviews-header { margin-bottom: 16px; color: var(--text-secondary); font-size: 0.875rem; }
    .reviews-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    mat-card { background: var(--surface-card) !important; border: 1px solid var(--border-color); border-radius: 14px !important; }
    .review-title { display: flex; align-items: center; gap: 10px; }
    .review-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, var(--brand-primary), #a78bfa);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.95rem; color: #fff; flex-shrink: 0;
    }
    .review-identity { flex: 1; display: flex; flex-direction: column; }
    .review-author { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
    .review-date { font-size: 0.75rem; color: var(--text-secondary); }
    .review-stars { display: flex; gap: 1px; }
    .star-filled { color: #f59e0b; font-size: 1rem; font-variation-settings: 'FILL' 1; }
    .star-empty { color: rgba(255,255,255,.2); font-size: 1rem; }
    .review-comment { font-size: 0.875rem; color: var(--text-secondary); margin: 0; }
    .pagination-row { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 24px; }
    .page-info { font-size: 0.875rem; color: var(--text-secondary); }
    .empty-card { text-align: center; padding: 48px; }
    .empty-icon { font-size: 3rem; color: var(--brand-primary); display: block; margin-bottom: 12px; }
    h3 { color: var(--text-primary); margin: 0 0 8px; }
    p { color: var(--text-secondary); font-size: 0.875rem; margin: 0; }
  `],
})
export class AdminReviewsTab implements OnInit {
  readonly loading = signal(true);
  readonly result = signal<PaginatedResult<Review> | null>(null);
  readonly reviews = signal<Review[]>([]);
  readonly currentPage = signal(1);
  readonly deletingId = signal<number | null>(null);

  constructor(
    private readonly reviewService: AdminReviewService,
    private readonly toast: ToastService,
  ) {}

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.reviewService.all(this.currentPage(), 20).subscribe({
      next: (r) => {
        this.result.set(r);
        this.reviews.set(r.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  nextPage(): void { this.currentPage.update(p => p + 1); this.load(); }
  prevPage(): void { this.currentPage.update(p => p - 1); this.load(); }

  delete(id: number): void {
    this.deletingId.set(id);
    this.reviewService.delete(id).subscribe({
      next: () => {
        this.reviews.update(rs => rs.filter(r => r.id !== id));
        this.result.update(r => r ? { ...r, totalCount: r.totalCount - 1 } : r);
        this.deletingId.set(null);
        this.toast.success('Review removed.');
      },
      error: () => {
        this.deletingId.set(null);
        this.toast.error('Could not remove review.');
      },
    });
  }

  starsArray(n: number): number[] { return Array.from({ length: n }); }
  emptyStars(n: number): number[] { return Array.from({ length: 5 - n }); }
}
