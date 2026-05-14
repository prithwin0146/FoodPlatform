import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReviewService } from '../../../core/services/review.service';
import { Review } from '../../../core/models';

/**
 * Inline review widget shown on the order-tracking page after delivery.
 * Emits `submitted` with the new Review when the customer submits.
 * (SRP: review UI concern only — no order state, no navigation)
 */
@Component({
  selector: 'app-review-widget',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    @if (submitted()) {
      <div class="review-done">
        <div class="review-stars-display">
          @for (s of [1,2,3,4,5]; track s) {
            <span class="material-symbols-rounded star-icon" [class.filled]="s <= submitted()!.stars">star</span>
          }
        </div>
        <p class="review-thanks">Thanks for your review! 🎉</p>
        @if (submitted()!.comment) {
          <p class="review-comment-display">"{{ submitted()!.comment }}"</p>
        }
      </div>
    } @else {
      <div class="review-form glass-card">
        <h3 class="review-title">
          <span class="material-symbols-rounded">rate_review</span>
          How was your meal?
        </h3>
        <div class="star-row">
          @for (s of [1,2,3,4,5]; track s) {
            <button type="button" class="star-btn" (click)="hoveredStar.set(0); selectedStar.set(s)"
              (mouseenter)="hoveredStar.set(s)" (mouseleave)="hoveredStar.set(0)">
              <span class="material-symbols-rounded star-icon"
                [class.filled]="s <= (hoveredStar() || selectedStar())">star</span>
            </button>
          }
        </div>
        <mat-form-field appearance="outline" class="dark-field comment-field">
          <mat-label>Leave a comment (optional)</mat-label>
          <textarea matInput [(ngModel)]="comment" rows="3" maxlength="1000"></textarea>
        </mat-form-field>
        <button mat-flat-button class="submit-review-btn"
          [disabled]="selectedStar() === 0 || submitting()"
          (click)="submit()">
          @if (submitting()) {
            <span class="material-symbols-rounded spin">progress_activity</span>
          }
          Submit Review
        </button>
        @if (error()) {
          <p class="review-error">{{ error() }}</p>
        }
      </div>
    }
  `,
  styleUrl: './review-widget.scss',
})
export class ReviewWidget {
  @Input({ required: true }) orderId!: number;
  @Output() reviewSubmitted = new EventEmitter<Review>();

  readonly selectedStar = signal(0);
  readonly hoveredStar = signal(0);
  readonly comment = signal('');
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly submitted = signal<Review | null>(null);

  constructor(private readonly reviewService: ReviewService) {}

  submit(): void {
    if (this.selectedStar() === 0 || this.submitting()) return;
    this.submitting.set(true);
    this.error.set(null);
    this.reviewService.submit(this.orderId, {
      stars: this.selectedStar(),
      comment: this.comment() || null,
    }).subscribe({
      next: (review) => {
        this.submitting.set(false);
        this.submitted.set(review);
        this.reviewSubmitted.emit(review);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.error ?? 'Failed to submit review. Please try again.');
      },
    });
  }
}
