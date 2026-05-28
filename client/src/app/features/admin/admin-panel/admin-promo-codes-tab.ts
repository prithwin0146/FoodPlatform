import { Component, OnInit, signal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { PromoCodeService } from '../../../core/services/promo-code.service';
import { ToastService } from '../../../core/services/toast.service';
import { PromoCode, CreatePromoCodeRequest } from '../../../core/models';

/**
 * CRUD management for platform-wide promo codes.
 * (SRP: promo code admin UI only; delegates HTTP to PromoCodeService)
 */
@Component({
  selector: 'app-admin-promo-codes-tab',
  standalone: true,
  imports: [
    DatePipe, CurrencyPipe, FormsModule,
    MatTableModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressBarModule,
    MatTooltipModule, MatChipsModule, MatDividerModule,
  ],
  template: `
    @if (loading()) { <mat-progress-bar mode="indeterminate" /> }

    <div class="promo-tab">
      <!-- Create Form -->
      <section class="create-section">
        <h3 class="section-title">
          <span class="material-symbols-rounded">add_circle</span> Create Promo Code
        </h3>
        <div class="create-form">
          <mat-form-field appearance="outline" class="dark-field">
            <mat-label>Code</mat-label>
            <input matInput [(ngModel)]="form.code" placeholder="e.g. WELCOME10">
          </mat-form-field>
          <mat-form-field appearance="outline" class="dark-field">
            <mat-label>Description</mat-label>
            <input matInput [(ngModel)]="form.description" placeholder="Welcome discount">
          </mat-form-field>
          <mat-form-field appearance="outline" class="dark-field">
            <mat-label>Type</mat-label>
            <mat-select [(ngModel)]="form.discountType">
              <mat-option value="Percentage">Percentage (%)</mat-option>
              <mat-option value="Fixed">Fixed (£)</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="dark-field">
            <mat-label>Value</mat-label>
            <input matInput type="number" [(ngModel)]="form.discountValue" min="0">
          </mat-form-field>
          <mat-form-field appearance="outline" class="dark-field">
            <mat-label>Min Order (£)</mat-label>
            <input matInput type="number" [(ngModel)]="form.minOrderAmount" min="0">
          </mat-form-field>
          <mat-form-field appearance="outline" class="dark-field">
            <mat-label>Max Uses (blank = unlimited)</mat-label>
            <input matInput type="number" [(ngModel)]="form.maxUses" min="0">
          </mat-form-field>
          <mat-form-field appearance="outline" class="dark-field">
            <mat-label>Expires At (optional)</mat-label>
            <input matInput type="datetime-local" [(ngModel)]="form.expiresAtStr">
          </mat-form-field>
          <button mat-flat-button color="primary" (click)="create()" [disabled]="saving() || !form.code.trim() || !form.discountValue">
            <span class="material-symbols-rounded">save</span> Create
          </button>
        </div>
      </section>

      <mat-divider />

      <!-- Table -->
      <section class="table-section">
        <h3 class="section-title">
          <span class="material-symbols-rounded">confirmation_number</span> All Promo Codes
        </h3>
        @if (codes().length === 0 && !loading()) {
          <div class="empty-state">
            <span class="material-symbols-rounded empty-icon">confirmation_number</span>
            <p>No promo codes yet</p>
          </div>
        } @else {
          <div class="table-wrap">
            <table mat-table [dataSource]="codes()" class="promo-table">
              <ng-container matColumnDef="code">
                <th mat-header-cell *matHeaderCellDef>Code</th>
                <td mat-cell *matCellDef="let c"><strong>{{ c.code }}</strong></td>
              </ng-container>
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let c">{{ c.description }}</td>
              </ng-container>
              <ng-container matColumnDef="discount">
                <th mat-header-cell *matHeaderCellDef>Discount</th>
                <td mat-cell *matCellDef="let c">
                  @if (c.discountType === 'Percentage') { {{ c.discountValue }}% off }
                  @else { {{ c.discountValue | currency:'GBP' }} off }
                </td>
              </ng-container>
              <ng-container matColumnDef="uses">
                <th mat-header-cell *matHeaderCellDef>Uses</th>
                <td mat-cell *matCellDef="let c">
                  {{ c.usedCount }} / {{ c.maxUses ?? '∞' }}
                </td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let c">
                  <mat-chip [class]="c.isActive ? 'chip-active' : 'chip-inactive'">
                    {{ c.isActive ? 'Active' : 'Inactive' }}
                  </mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="expires">
                <th mat-header-cell *matHeaderCellDef>Expires</th>
                <td mat-cell *matCellDef="let c">{{ c.expiresAt ? (c.expiresAt | date:'dd MMM yyyy') : '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let c">
                  <button mat-icon-button
                    [matTooltip]="c.isActive ? 'Deactivate' : 'Activate'"
                    (click)="toggleActive(c)">
                    <span class="material-symbols-rounded">{{ c.isActive ? 'toggle_on' : 'toggle_off' }}</span>
                  </button>
                  <button mat-icon-button matTooltip="Delete" (click)="delete(c.id)" class="delete-btn">
                    <span class="material-symbols-rounded">delete</span>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"></tr>
            </table>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .promo-tab { display: flex; flex-direction: column; gap: 24px; }
    .section-title { display: flex; align-items: center; gap: 8px; font-size: 1rem; font-weight: 700; margin: 0 0 16px; }
    .create-form { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-start; }
    .create-form mat-form-field { flex: 1 1 180px; }
    .table-wrap { overflow-x: auto; }
    .promo-table { width: 100%; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 32px; color: var(--text-secondary); .empty-icon { font-size: 2.5rem; } }
    .chip-active { background: rgba(34,197,94,.15) !important; color: #22c55e !important; }
    .chip-inactive { background: rgba(239,68,68,.12) !important; color: #ef4444 !important; }
    .delete-btn .material-symbols-rounded { color: #ef4444; }
    .table-section { margin-top: 8px; }
  `],
})
export class AdminPromoCodesTab implements OnInit {
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly codes = signal<PromoCode[]>([]);

  readonly columns = ['code', 'description', 'discount', 'uses', 'status', 'expires', 'actions'];

  form: CreatePromoCodeRequest & { expiresAtStr: string } = {
    code: '', description: '', discountType: 'Percentage',
    discountValue: 10, minOrderAmount: 0, maxUses: null, expiresAt: null,
    expiresAtStr: '',
  };

  constructor(
    private readonly promoService: PromoCodeService,
    private readonly toast: ToastService,
  ) {}

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.promoService.getAll().subscribe({
      next: (data) => { this.codes.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Failed to load promo codes'); },
    });
  }

  create(): void {
    this.saving.set(true);
    const payload: CreatePromoCodeRequest = {
      ...this.form,
      code: this.form.code.trim().toUpperCase(),
      expiresAt: this.form.expiresAtStr ? new Date(this.form.expiresAtStr).toISOString() : null,
    };
    this.promoService.create(payload).subscribe({
      next: (created) => {
        this.codes.update(c => [created, ...c]);
        this.saving.set(false);
        this.toast.success('Promo code created');
        this.form = { code: '', description: '', discountType: 'Percentage', discountValue: 10, minOrderAmount: 0, maxUses: null, expiresAt: null, expiresAtStr: '' };
      },
      error: () => { this.saving.set(false); this.toast.error('Failed to create promo code'); },
    });
  }

  toggleActive(c: PromoCode): void {
    this.promoService.update(c.id, { isActive: !c.isActive }).subscribe({
      next: (updated) => {
        this.codes.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.toast.success(`Code ${updated.isActive ? 'activated' : 'deactivated'}`);
      },
      error: () => this.toast.error('Failed to update'),
    });
  }

  delete(id: number): void {
    if (!confirm('Delete this promo code?')) return;
    this.promoService.delete(id).subscribe({
      next: () => { this.codes.update(list => list.filter(c => c.id !== id)); this.toast.success('Deleted'); },
      error: () => this.toast.error('Failed to delete'),
    });
  }
}
